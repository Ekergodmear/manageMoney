import type { PlanCandidateRepository } from '@/services/storage/repositories/plan-candidate-repository';
import type { PersistedAppState } from '@/features/session/session-types';

export interface DeletePlanCandidateUseCaseDeps {
  readonly candidates: PlanCandidateRepository;
}

export type DeletePlanCandidateSuccess = {
  readonly ok: true;
  readonly nextState: PersistedAppState;
};

export type DeletePlanCandidateFailure = {
  readonly ok: false;
  readonly reason: 'no-candidate';
};

export type DeletePlanCandidateResult = DeletePlanCandidateSuccess | DeletePlanCandidateFailure;

export class DeletePlanCandidateUseCase {
  constructor(private readonly deps: DeletePlanCandidateUseCaseDeps) {}

  async execute(): Promise<DeletePlanCandidateResult> {
    const candidate = await this.deps.candidates.get();
    if (candidate === null) {
      return { ok: false, reason: 'no-candidate' };
    }
    const nextState = await this.deps.candidates.clearCandidate();
    return { ok: true, nextState };
  }
}

export function createDeletePlanCandidateUseCase(
  deps: DeletePlanCandidateUseCaseDeps,
): DeletePlanCandidateUseCase {
  return new DeletePlanCandidateUseCase(deps);
}
