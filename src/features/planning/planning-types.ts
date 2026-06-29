import type { GenerateResult, PlannerFormValues } from '@/features/planner/plan-service';

/** Aggregate riêng — chưa promote thành Session. */
export interface PlanningDraft {
  readonly draftId: string;
  readonly planId: string;
  readonly presetId: string;
  readonly formValues: PlannerFormValues;
  readonly generated: GenerateResult;
  readonly createdAt: string;
}

export type PlanningView = 'form' | 'decision' | 'plan';

/** Migrate legacy M4 shape (sessionId → draftId). */
export function normalizePlanningDraft(raw: unknown): PlanningDraft | null {
  if (raw === null || typeof raw !== 'object') {
    return null;
  }
  const value = raw as PlanningDraft & { sessionId?: string };
  const draftId = value.draftId ?? value.sessionId;
  if (draftId === undefined || value.planId === undefined) {
    return null;
  }
  return {
    draftId,
    planId: value.planId,
    presetId: value.presetId,
    formValues: value.formValues,
    generated: value.generated,
    createdAt: value.createdAt,
  };
}
