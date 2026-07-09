import type { Clock } from '@/services/clock/clock';
import type { EventBus } from '@/services/events/domain-events';
import type { PlanningDraftRepository } from '@/services/storage/repositories/planning-draft-repository';
import type { SessionRepository } from '@/services/storage/repositories/session-repository';
import { startCurrentPlan, type Session } from '@/features/session/session-domain';
import type { PersistedAppState } from '@/features/session/session-types';
import { createSessionFromDraft } from '@/features/session/session-factory';

export interface PromotePlanningDraftUseCaseDeps {
  readonly planningDrafts: PlanningDraftRepository;
  readonly sessions: SessionRepository;
  readonly events: EventBus;
  readonly clock: Clock;
}

export interface PromotePlanningDraftExecuteInput {
  readonly startPlaying?: boolean;
}

export type PromotePlanningDraftSuccess = {
  readonly ok: true;
  readonly session: Session;
  readonly nextState: PersistedAppState;
};

export type PromotePlanningDraftFailure = {
  readonly ok: false;
  readonly reason: 'no-draft';
};

export type PromotePlanningDraftResult = PromotePlanningDraftSuccess | PromotePlanningDraftFailure;

/**
 * PlanningDraft → SessionFactory → persistence → SessionCreated → clear draft.
 */
export class PromotePlanningDraftUseCase {
  constructor(private readonly deps: PromotePlanningDraftUseCaseDeps) {}

  async execute(
    input: PromotePlanningDraftExecuteInput = {},
  ): Promise<PromotePlanningDraftResult> {
    const draft = await this.deps.planningDrafts.get();
    if (draft === null) {
      return { ok: false, reason: 'no-draft' };
    }

    const state = await this.deps.sessions.loadState();
    const at = this.deps.clock.now().toISOString();
    let session = createSessionFromDraft(draft, state.nextSessionNumber, at);
    if (input.startPlaying === true) {
      session = startCurrentPlan(session);
    }

    const nextState: PersistedAppState = {
      ...state,
      nextSessionNumber: state.nextSessionNumber + 1,
      activeSessionId: session.id,
      sessions: [session, ...state.sessions.filter((s) => s.id !== session.id)],
      planningDraft: null,
    };
    await this.deps.sessions.saveState(nextState);

    this.deps.events.emit(
      this.deps.events.createEvent('SessionCreated', {
        sessionId: session.id,
        planId: draft.planId,
        originDraftId: draft.draftId,
      }),
    );

    return { ok: true, session, nextState };
  }
}

export function createPromotePlanningDraftUseCase(
  deps: PromotePlanningDraftUseCaseDeps,
): PromotePlanningDraftUseCase {
  return new PromotePlanningDraftUseCase(deps);
}
