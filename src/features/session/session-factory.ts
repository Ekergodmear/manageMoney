import type { NewSessionPlanCandidate } from '@/features/planning/plan-candidate-types';
import type { PlanningDraft } from '@/features/planning/planning-types';
import type { GenerateResult, PlannerFormValues } from '@/features/planner/plan-service';
import type { Session } from '@/features/session/session-domain';
import { buildPlanAddedEvent, createInitialPlan } from '@/features/session/plan-factory';

export function createSessionFromDraft(
  draft: PlanningDraft,
  sessionNumber: number,
  at: string,
): Session {
  const sessionId = crypto.randomUUID();
  const plan = createInitialPlan({
    planId: draft.planId,
    index: 0,
    origin: 'generate',
    formValues: draft.formValues,
    generated: draft.generated,
    createdAt: at,
  });

  return {
    id: sessionId,
    sessionNumber,
    title: `Session #${String(sessionNumber)}`,
    presetId: draft.presetId,
    status: 'draft',
    plans: [plan],
    currentPlanId: draft.planId,
    timeline: [{ at, type: 'session-created' }, buildPlanAddedEvent(plan, at, 'Generate')],
    notes: '',
    startedAt: null,
    profitAmount: null,
    favorite: false,
    archived: false,
    tags: [],
    lastSettledDrawKey: null,
    playedRounds: [],
    originDraftId: draft.draftId,
    createdAt: at,
    updatedAt: at,
  };
}

export function createSessionFromCandidate(
  candidate: NewSessionPlanCandidate,
  sessionNumber: number,
  at: string,
): Session {
  const sessionId = crypto.randomUUID();
  const origin = candidate.source === 'capital' ? 'capital' : 'scenario';
  const plan = createInitialPlan({
    index: 0,
    origin,
    formValues: candidate.formValues,
    generated: candidate.generated,
    createdAt: at,
  });

  return {
    id: sessionId,
    sessionNumber,
    title: `Session #${String(sessionNumber)}`,
    presetId: candidate.presetId,
    status: 'draft',
    plans: [plan],
    currentPlanId: plan.id,
    timeline: [{ at, type: 'session-created' }, buildPlanAddedEvent(plan, at, candidate.label)],
    notes: '',
    startedAt: null,
    profitAmount: null,
    favorite: false,
    archived: false,
    tags: [],
    lastSettledDrawKey: null,
    playedRounds: [],
    ...(candidate.recommendationId !== undefined
      ? { originRecommendationId: candidate.recommendationId }
      : {}),
    createdAt: at,
    updatedAt: at,
  };
}

/** @deprecated Không dùng — Scenario/Capital đi qua RecommendationSet → Candidate → createFromCandidate. */
export function createSessionFromGenerate(
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
