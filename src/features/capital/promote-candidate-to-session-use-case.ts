import type { Clock } from '@/services/clock/clock';
import type { EventBus } from '@/services/events/domain-events';
import type { PlanCandidateRepository } from '@/services/storage/repositories/plan-candidate-repository';
import type { SessionRepository } from '@/services/storage/repositories/session-repository';
import { isNewSessionCandidate } from '@/features/planning/plan-candidate-types';
import { stopSession } from '@/features/session/session-domain';
import type { PersistedAppState } from '@/features/session/session-types';
import { createSessionFromCandidate } from '@/features/session/session-factory';
import { getCurrentPlan, type Session } from '@/features/session/session-domain';

export interface PromoteCandidateToSessionUseCaseDeps {
  readonly candidates: PlanCandidateRepository;
  readonly sessions: SessionRepository;
  readonly events: EventBus;
  readonly clock: Clock;
}

export interface PromoteCandidateToSessionExecuteInput {
  readonly stopActivePlaying?: boolean;
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

function upsertSession(sessions: readonly Session[], session: Session): Session[] {
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index < 0) {
    return [session, ...sessions];
  }
  return sessions.map((s, i) => (i === index ? session : s));
}

/**
 * PlanCandidate (new-session) → SessionFactory → SessionCreated → PlanPromoted → clear candidate.
 */
export class PromoteCandidateToSessionUseCase {
  constructor(private readonly deps: PromoteCandidateToSessionUseCaseDeps) {}

  async execute(
    input: PromoteCandidateToSessionExecuteInput = {},
  ): Promise<PromoteCandidateToSessionResult> {
    let state = await this.deps.sessions.loadState();
    const candidate = state.planCandidate;
    if (candidate === null) {
      return { ok: false, reason: 'no-candidate' };
    }
    if (!isNewSessionCandidate(candidate)) {
      return { ok: false, reason: 'wrong-target' };
    }

    if (input.stopActivePlaying === true && state.activeSessionId !== null) {
      const current = state.sessions.find((s) => s.id === state.activeSessionId);
      if (current !== undefined && current.status === 'playing') {
        state = {
          ...state,
          activeSessionId: null,
          sessions: upsertSession(state.sessions, stopSession(current)),
        };
      }
    }

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
      sessions: [session, ...state.sessions.filter((s) => s.id !== session.id)],
      planCandidate: null,
      recommendationSet: null,
    };
    await this.deps.sessions.saveState(nextState);

    this.deps.events.emit(
      this.deps.events.createEvent('SessionCreated', {
        sessionId: session.id,
        planId: plan.id,
        ...(candidate.recommendationId !== undefined
          ? { originRecommendationId: candidate.recommendationId }
          : {}),
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
