import type { Clock } from '@/services/clock/clock';
import type { EventBus } from '@/services/events/domain-events';
import type { PlanningDraft } from '@/features/planning/planning-types';
import type { PlanningDraftRepository } from '@/services/storage/repositories/planning-draft-repository';
import {
  generatePlan,
  type GenerateResult,
  type PlannerField,
  type PlannerFormValues,
} from '@/features/planner/plan-service';

export interface GeneratePlanUseCaseDeps {
  readonly planningDrafts: PlanningDraftRepository;
  readonly events: EventBus;
  readonly clock: Clock;
}

export interface GeneratePlanExecuteInput {
  readonly formValues: PlannerFormValues;
  readonly presetId: string;
}

export type GeneratePlanExecuteSuccess = {
  readonly ok: true;
  readonly draft: PlanningDraft;
  readonly generated: GenerateResult;
};

export type GeneratePlanExecuteFailure = {
  readonly ok: false;
  readonly fieldErrors: Partial<Record<PlannerField, string>>;
};

export type GeneratePlanExecuteResult = GeneratePlanExecuteSuccess | GeneratePlanExecuteFailure;

/**
 * Golden path — validate → solve → statistics → persistence → PlanGenerated.
 * Workspace chỉ gọi execute(); không biết telemetry/logger.
 */
export class GeneratePlanUseCase {
  constructor(private readonly deps: GeneratePlanUseCaseDeps) {}

  async execute(input: GeneratePlanExecuteInput): Promise<GeneratePlanExecuteResult> {
    const formValues: PlannerFormValues = {
      ...input.formValues,
      presetId: input.presetId,
    };

    const outcome = generatePlan(formValues);
    if (outcome.fieldErrors !== undefined) {
      return { ok: false, fieldErrors: outcome.fieldErrors };
    }
    if (outcome.result === undefined) {
      return {
        ok: false,
        fieldErrors: { request: 'Không tạo được kế hoạch. Vui lòng kiểm tra lại thông tin.' },
      };
    }

    const draftId = crypto.randomUUID();
    const planId = crypto.randomUUID();
    const createdAt = this.deps.clock.now().toISOString();

    const draft: PlanningDraft = {
      draftId,
      planId,
      presetId: input.presetId,
      formValues,
      generated: outcome.result,
      createdAt,
    };

    await this.deps.planningDrafts.save(draft);

    this.deps.events.emit(
      this.deps.events.createEvent('PlanGenerated', {
        sessionId: draftId,
        planId,
      }),
    );
    this.deps.events.emit(
      this.deps.events.createEvent('PlanningDraftSaved', {
        draftId,
        planId,
      }),
    );

    return { ok: true, draft, generated: outcome.result };
  }
}

export function createGeneratePlanUseCase(deps: GeneratePlanUseCaseDeps): GeneratePlanUseCase {
  return new GeneratePlanUseCase(deps);
}
