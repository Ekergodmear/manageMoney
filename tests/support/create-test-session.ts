import type { GenerateResult, PlannerFormValues } from '@/features/planner/plan-service';
import { buildPlanAddedEvent, createInitialPlan } from '@/features/session/plan-factory';
import type { Session } from '@/features/session/session-domain';

/** Test helper — mirrors legacy generate flow without deprecated session-factory API. */
export function createTestSessionFromGenerate(
  values: PlannerFormValues,
  result: GenerateResult,
  presetId: string,
  sessionNumber: number,
): Session {
  const sessionId = crypto.randomUUID();
  const at = new Date().toISOString();
  const plan = createInitialPlan({
    index: 0,
    origin: 'generate',
    formValues: values,
    generated: result,
    createdAt: at,
  });

  return {
    id: sessionId,
    sessionNumber,
    title: `Session #${String(sessionNumber)}`,
    presetId,
    status: 'draft',
    plans: [plan],
    currentPlanId: plan.id,
    timeline: [{ at, type: 'session-created' }, buildPlanAddedEvent(plan, at, 'Generate')],
    notes: '',
    startedAt: null,
    profitAmount: null,
    favorite: false,
    archived: false,
    tags: [],
    lastSettledDrawKey: null,
    playedRounds: [],
    createdAt: at,
    updatedAt: at,
  };
}
