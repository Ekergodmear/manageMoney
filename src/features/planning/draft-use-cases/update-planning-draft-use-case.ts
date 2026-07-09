import type { EventBus } from '@/services/events/domain-events';
import type { PlanningDraft } from '@/features/planning/planning-types';
import type { PlanningDraftRepository } from '@/services/storage/repositories/planning-draft-repository';
import {
  generatePlan,
  type GenerateResult,
  type PlannerField,
  type PlannerFormValues,
} from '@/features/planner/plan-service';
import type { PersistedAppState } from '@/features/session/session-types';

export interface UpdatePlanningDraftUseCaseDeps {
  readonly planningDrafts: PlanningDraftRepository;
  readonly events: EventBus;
}

export interface UpdatePlanningDraftExecuteInput {
  readonly formValues: PlannerFormValues;
}

export type UpdatePlanningDraftSuccess = {
  readonly ok: true;
  readonly draft: PlanningDraft;
  readonly generated: GenerateResult;
  readonly nextState: PersistedAppState;
};

export type UpdatePlanningDraftFailure =
  | { readonly ok: false; readonly reason: 'no-draft' }
  | {
      readonly ok: false;
      readonly reason: 'validation-failed';
      readonly fieldErrors: Partial<Record<PlannerField, string>>;
    };

export type UpdatePlanningDraftResult = UpdatePlanningDraftSuccess | UpdatePlanningDraftFailure;

export class UpdatePlanningDraftUseCase {
  constructor(private readonly deps: UpdatePlanningDraftUseCaseDeps) {}

  async execute(input: UpdatePlanningDraftExecuteInput): Promise<UpdatePlanningDraftResult> {
    const current = await this.deps.planningDrafts.get();
    if (current === null) {
      return { ok: false, reason: 'no-draft' };
    }

    const formValues: PlannerFormValues = {
      ...input.formValues,
      presetId: current.presetId,
    };
    const outcome = generatePlan(formValues);
    if (outcome.fieldErrors !== undefined) {
      return { ok: false, reason: 'validation-failed', fieldErrors: outcome.fieldErrors };
    }
    if (outcome.result === undefined) {
      return {
        ok: false,
        reason: 'validation-failed',
        fieldErrors: { request: 'Không cập nhật được bản nháp. Vui lòng kiểm tra lại thông tin.' },
      };
    }

    const draft: PlanningDraft = {
      ...current,
      formValues,
      generated: outcome.result,
    };
    const nextState = await this.deps.planningDrafts.saveDraft(draft);

    this.deps.events.emit(
      this.deps.events.createEvent('PlanningDraftSaved', {
        draftId: draft.draftId,
        planId: draft.planId,
      }),
    );

    return { ok: true, draft, generated: outcome.result, nextState };
  }
}

export function createUpdatePlanningDraftUseCase(
  deps: UpdatePlanningDraftUseCaseDeps,
): UpdatePlanningDraftUseCase {
  return new UpdatePlanningDraftUseCase(deps);
}
