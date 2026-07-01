import type { PlanningDraftRepository } from '@/services/storage/repositories/planning-draft-repository';
import type { PersistedAppState } from '@/features/session/session-types';

export interface DeletePlanningDraftUseCaseDeps {
  readonly planningDrafts: PlanningDraftRepository;
}

export type DeletePlanningDraftSuccess = {
  readonly ok: true;
  readonly nextState: PersistedAppState;
};

export type DeletePlanningDraftFailure = {
  readonly ok: false;
  readonly reason: 'no-draft';
};

export type DeletePlanningDraftResult = DeletePlanningDraftSuccess | DeletePlanningDraftFailure;

export class DeletePlanningDraftUseCase {
  constructor(private readonly deps: DeletePlanningDraftUseCaseDeps) {}

  async execute(): Promise<DeletePlanningDraftResult> {
    const draft = await this.deps.planningDrafts.get();
    if (draft === null) {
      return { ok: false, reason: 'no-draft' };
    }
    const nextState = await this.deps.planningDrafts.clearDraft();
    return { ok: true, nextState };
  }
}

export function createDeletePlanningDraftUseCase(
  deps: DeletePlanningDraftUseCaseDeps,
): DeletePlanningDraftUseCase {
  return new DeletePlanningDraftUseCase(deps);
}
