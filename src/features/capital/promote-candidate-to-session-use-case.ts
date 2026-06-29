import type { Clock } from '@/services/clock/clock';
import type { EventBus } from '@/services/events/domain-events';
import type { PlanCandidateRepository } from '@/services/storage/repositories/plan-candidate-repository';
import type { SessionRepository } from '@/services/storage/repositories/session-repository';
import { isNewSessionCandidate } from '@/features/planning/plan-candidate-types';
import type { PersistedAppState } from '@/features/session/session-types';
import { createSessionFromCandidate } from '@/features/session/session-factory';
import { getCurrentPlan } from '@/features/session/session-domain';

export interface PromoteCandidateToSessionUseCaseDeps {
  readonly candidates: PlanCandidateRepository;
  readonly sessions: SessionRepository;
  readonly events: EventBus;
  readonly clock: Clock;
}

export type PromoteCandidateToSessionSuccess = {
  readonly ok: true;
  readonly nextState: PersistedAppState;
};

export type PromoteCandidateToSessionFailure = {
  readonly ok: false;
  readonly reason: 'no-candidate' | 'wrong-target';
};

export type PromoteCandidateToSessionResult =
  | PromoteCandidateToSessionSuccess
  | PromoteCandidateToSessionFailure;

/**
 * PlanCandidate (new-session) → SessionFactory → SessionCreated → PlanPromoted → clear candidate.
 */
export class PromoteCandidateToSessionUseCase {
  constructor(private readonly deps: PromoteCandidateToSessionUseCaseDeps) {}

  async execute(): Promise<PromoteCandidateToSessionResult> {
    const candidate = await this.deps.candidates.get();
    if (candidate === null) {
      return { ok: false, reason: 'no-candidate' };
    }
    if (!isNewSessionCandidate(candidate)) {
      return { ok: false, reason: 'wrong-target' };
    }

    const state = await this.deps.sessions.loadState();
    const at = this.deps.clock.now().toISOString();
    const session = createSessionFromCandidate(candidate, state.nextSessionNumber, at);
    const plan = getCurrentPlan(session);
    if (plan === null) {
      return { ok: false, reason: 'no-candidate' };
    }

    const nextState: PersistedAppState = {
      ...state,
      nextSessionNumber: state.nextSessionNumber + 1,
      activeSessionId: session.id,
      activePresetId: candidate.presetId,
      sessions: [session, ...state.sessions],
      planCandidate: null,
      recommendationSet: null,
    };
    await this.deps.sessions.saveState(nextState);
    await this.deps.candidates.clear();

    this.deps.events.emit(
      this.deps.events.createEvent('SessionCreated', {
        sessionId: session.id,
        planId: plan.id,
        originRecommendationId: candidate.recommendationId,
      }),
    );

    this.deps.events.emit(
      this.deps.events.createEvent('PlanPromoted', {
        sessionId: session.id,
        planId: plan.id,
        parentPlanId: plan.id,
        origin: plan.origin,
      }),
    );

    return { ok: true, nextState };
  }
}

export function createPromoteCandidateToSessionUseCase(
  deps: PromoteCandidateToSessionUseCaseDeps,
): PromoteCandidateToSessionUseCase {
  return new PromoteCandidateToSessionUseCase(deps);
}
