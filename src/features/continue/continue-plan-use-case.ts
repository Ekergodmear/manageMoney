import type { Clock } from '@/services/clock/clock';
import type { EventBus } from '@/services/events/domain-events';
import type { SessionRepository } from '@/services/storage/repositories/session-repository';
import { buildContinuationContext } from '@/features/continue/continuation-context';
import { continuePlan } from '@/features/planner/plan-service';
import type { Session } from '@/features/session/session-domain';
import { getCurrentPlan } from '@/features/session/session-domain';
import type { PersistedAppState } from '@/features/session/session-types';
import {
  buildPlanAddedEvent,
  createContinuationPlan,
  supersedeParentPlan,
} from '@/features/session/plan-factory';

export interface ContinuePlanUseCaseDeps {
  readonly sessions: SessionRepository;
  readonly events: EventBus;
  readonly clock: Clock;
}

export interface ContinuePlanInput {
  readonly sessionId: string;
  readonly targetTotalRounds: number;
}

export type ContinuePlanFailureReason =
  | 'session-not-found'
  | 'parent-not-found'
  | 'invalid-target'
  | 'generate-failed';

export type ContinuePlanSuccess = {
  readonly ok: true;
  readonly session: Session;
  readonly planId: string;
  readonly nextState: PersistedAppState;
};

export type ContinuePlanFailure = {
  readonly ok: false;
  readonly reason: ContinuePlanFailureReason;
  readonly message?: string;
};

export type ContinuePlanResult = ContinuePlanSuccess | ContinuePlanFailure;

/**
 * Session → ContinuationContext → Engine → PlanFactory.createContinuation → PlanAdded(origin=continue).
 * Không đi qua Recommendation/Candidate.
 */
export class ContinuePlanUseCase {
  constructor(private readonly deps: ContinuePlanUseCaseDeps) {}

  async execute(input: ContinuePlanInput): Promise<ContinuePlanResult> {
    const state = await this.deps.sessions.loadState();
    const session = state.sessions.find((s) => s.id === input.sessionId);
    if (session === undefined) {
      return { ok: false, reason: 'session-not-found' };
    }

    const parent = getCurrentPlan(session);
    if (parent === null) {
      return { ok: false, reason: 'parent-not-found' };
    }

    const currentTotalRounds = parent.generated.strategy.rounds.length;
    if (
      !Number.isFinite(input.targetTotalRounds) ||
      input.targetTotalRounds <= currentTotalRounds
    ) {
      return {
        ok: false,
        reason: 'invalid-target',
        message: `Số vòng mới phải lớn hơn ${String(currentTotalRounds)}.`,
      };
    }

    const context = buildContinuationContext(session, parent, input.targetTotalRounds);
    const outcome = continuePlan(parent.formValues, context.targetTotalRounds);
    if (outcome.fieldErrors !== undefined || outcome.result === undefined) {
      return {
        ok: false,
        reason: 'generate-failed',
        message: outcome.fieldErrors?.roundCount ?? 'Không tạo được plan tiếp theo.',
      };
    }

    const at = this.deps.clock.now().toISOString();
    const newPlan = createContinuationPlan({
      parentPlan: parent,
      planIndex: session.plans.length,
      generated: outcome.result,
      formValues: {
        ...parent.formValues,
        roundCount: String(context.targetTotalRounds),
      },
      at,
    });
    const supersededParent = supersedeParentPlan(parent, at);
    const timelineEvent = buildPlanAddedEvent(
      newPlan,
      at,
      `Continue → ${String(context.targetTotalRounds)} vòng`,
    );

    const updatedSession: Session = {
      ...session,
      status: 'playing',
      plans: [...session.plans.map((p) => (p.id === parent.id ? supersededParent : p)), newPlan],
      currentPlanId: newPlan.id,
      timeline: [...session.timeline, timelineEvent],
      updatedAt: at,
    };

    const nextState: PersistedAppState = {
      ...state,
      activeSessionId: updatedSession.id,
      sessions: state.sessions.map((s) => (s.id === session.id ? updatedSession : s)),
    };
    await this.deps.sessions.saveState(nextState);

    this.deps.events.emit(
      this.deps.events.createEvent('ContinuationCreated', {
        sessionId: updatedSession.id,
        planId: newPlan.id,
        parentPlanId: parent.id,
      }),
    );
    this.deps.events.emit(
      this.deps.events.createEvent('PlanPromoted', {
        sessionId: updatedSession.id,
        planId: newPlan.id,
        parentPlanId: parent.id,
        origin: 'continue',
      }),
    );

    return { ok: true, session: updatedSession, planId: newPlan.id, nextState };
  }
}

export function createContinuePlanUseCase(deps: ContinuePlanUseCaseDeps): ContinuePlanUseCase {
  return new ContinuePlanUseCase(deps);
}
