import type { Clock } from '@/services/clock/clock';
import type { EventBus } from '@/services/events/domain-events';
import type { PlanCandidateRepository } from '@/services/storage/repositories/plan-candidate-repository';
import type { SessionRepository } from '@/services/storage/repositories/session-repository';
import { isAppendPlanCandidate } from '@/features/planning/plan-candidate-types';
import type { Session } from '@/features/session/session-domain';
import { findPlan, getCurrentPlan } from '@/features/session/session-domain';
import {
  buildPlanAddedEvent,
  createPlanFromCandidate,
  supersedeParentPlan,
} from '@/features/session/plan-factory';

export interface PromoteCandidateToPlanUseCaseDeps {
  readonly candidates: PlanCandidateRepository;
  readonly sessions: SessionRepository;
  readonly events: EventBus;
  readonly clock: Clock;
}

export type PromoteCandidateToPlanSuccess = {
  readonly ok: true;
  readonly session: Session;
  readonly planId: string;
};

export type PromoteCandidateToPlanFailure = {
  readonly ok: false;
  readonly reason: 'no-candidate' | 'session-not-found' | 'parent-not-found';
};

export type PromoteCandidateToPlanResult =
  | PromoteCandidateToPlanSuccess
  | PromoteCandidateToPlanFailure;

/**
 * PlanCandidate → PlanFactory → append Plan → PlanPromoted → clear candidate.
 */
export class PromoteCandidateToPlanUseCase {
  constructor(private readonly deps: PromoteCandidateToPlanUseCaseDeps) {}

  async execute(): Promise<PromoteCandidateToPlanResult> {
    const candidate = await this.deps.candidates.get();
    if (candidate === null) {
      return { ok: false, reason: 'no-candidate' };
    }
    if (!isAppendPlanCandidate(candidate)) {
      return { ok: false, reason: 'session-not-found' };
    }

    const state = await this.deps.sessions.loadState();
    const session = state.sessions.find((s) => s.id === candidate.sessionId);
    if (session === undefined) {
      return { ok: false, reason: 'session-not-found' };
    }

    const parent = findPlan(session, candidate.parentPlanId) ?? getCurrentPlan(session);
    if (parent === null) {
      return { ok: false, reason: 'parent-not-found' };
    }

    const at = this.deps.clock.now().toISOString();
    const newPlan = createPlanFromCandidate(candidate, parent, session.plans.length, at);
    const supersededParent = supersedeParentPlan(parent, at);
    const timelineEvent = buildPlanAddedEvent(newPlan, at, candidate.label);

    const updatedSession: Session = {
      ...session,
      status: newPlan.status === 'playing' ? 'playing' : session.status,
      plans: [...session.plans.map((p) => (p.id === parent.id ? supersededParent : p)), newPlan],
      currentPlanId: newPlan.id,
      timeline: [...session.timeline, timelineEvent],
      updatedAt: at,
    };

    const nextState = {
      ...state,
      sessions: state.sessions.map((s) => (s.id === session.id ? updatedSession : s)),
      planCandidate: null,
    };
    await this.deps.sessions.saveState(nextState);
    await this.deps.candidates.clear();

    this.deps.events.emit(
      this.deps.events.createEvent('PlanPromoted', {
        sessionId: updatedSession.id,
        planId: newPlan.id,
        parentPlanId: parent.id,
        origin: newPlan.origin,
      }),
    );

    return { ok: true, session: updatedSession, planId: newPlan.id };
  }
}

export function createPromoteCandidateToPlanUseCase(
  deps: PromoteCandidateToPlanUseCaseDeps,
): PromoteCandidateToPlanUseCase {
  return new PromoteCandidateToPlanUseCase(deps);
}
