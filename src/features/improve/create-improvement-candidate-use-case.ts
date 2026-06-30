import type { Clock } from '@/services/clock/clock';
import type { EventBus } from '@/services/events/domain-events';
import type { PlanCandidateRepository } from '@/services/storage/repositories/plan-candidate-repository';
import type { SessionRepository } from '@/services/storage/repositories/session-repository';
import { applyImproveOption, type ImproveOption } from '@/features/improve/improve-service';
import {
  createPlanCandidateFromImprove,
  type PlanCandidate,
} from '@/features/planning/plan-candidate-types';
import { getCurrentPlan } from '@/features/session/session-domain';

export interface CreateImprovementCandidateUseCaseDeps {
  readonly candidates: PlanCandidateRepository;
  readonly sessions: SessionRepository;
  readonly events: EventBus;
  readonly clock: Clock;
}

export interface CreateImprovementCandidateInput {
  readonly sessionId: string;
  readonly option: ImproveOption;
}

export type CreateImprovementCandidateSuccess = {
  readonly ok: true;
  readonly candidate: PlanCandidate;
};

export type CreateImprovementCandidateFailure = {
  readonly ok: false;
  readonly reason: 'session-not-found' | 'no-current-plan';
};

export type CreateImprovementCandidateResult =
  | CreateImprovementCandidateSuccess
  | CreateImprovementCandidateFailure;

/**
 * Improve → optimize → PlanCandidate (chưa mutate Session.plans).
 */
export class CreateImprovementCandidateUseCase {
  constructor(private readonly deps: CreateImprovementCandidateUseCaseDeps) {}

  async execute(input: CreateImprovementCandidateInput): Promise<CreateImprovementCandidateResult> {
    const state = await this.deps.sessions.loadState();
    const session = state.sessions.find((s) => s.id === input.sessionId);
    if (session === undefined) {
      return { ok: false, reason: 'session-not-found' };
    }

    const parent = getCurrentPlan(session);
    if (parent === null) {
      return { ok: false, reason: 'no-current-plan' };
    }

    const formValues = applyImproveOption(parent.formValues, input.option);
    const createdAt = this.deps.clock.now().toISOString();
    const candidate = createPlanCandidateFromImprove({
      sessionId: session.id,
      parentPlanId: parent.id,
      presetId: session.presetId,
      formValues,
      generated: input.option.result,
      label: input.option.label,
      mode: input.option.mode,
      createdAt,
    });

    await this.deps.candidates.save(candidate);

    this.deps.events.emit(
      this.deps.events.createEvent('ImprovementCandidateCreated', {
        candidateId: candidate.candidateId,
        sessionId: candidate.sessionId,
        parentPlanId: candidate.parentPlanId,
        source: candidate.source,
      }),
    );

    return { ok: true, candidate };
  }
}

export function createImprovementCandidateUseCase(
  deps: CreateImprovementCandidateUseCaseDeps,
): CreateImprovementCandidateUseCase {
  return new CreateImprovementCandidateUseCase(deps);
}
