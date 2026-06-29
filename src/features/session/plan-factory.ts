import type { PlanCandidate } from '@/features/planning/plan-candidate-types';
import type { GenerateResult, PlannerFormValues } from '@/features/planner/plan-service';
import type {
  Plan,
  PlanOrigin,
  PlanStatus,
  SessionTimelineEvent,
} from '@/features/session/session-domain';
import { planOriginLabel } from '@/features/session/session-domain';

function planLabel(index: number): string {
  return `Plan ${String.fromCharCode(65 + index)}`;
}

export interface CreateInitialPlanInput {
  readonly planId?: string;
  readonly index: number;
  readonly origin: PlanOrigin;
  readonly formValues: PlannerFormValues;
  readonly generated: GenerateResult;
  readonly status?: PlanStatus;
  readonly completedThroughRound?: number;
  readonly createdAt: string;
}

export function createInitialPlan(input: CreateInitialPlanInput): Plan {
  return {
    id: input.planId ?? crypto.randomUUID(),
    label: planLabel(input.index),
    origin: input.origin,
    parentPlanId: null,
    formValues: input.formValues,
    generated: input.generated,
    status: input.status ?? 'ready',
    completedThroughRound: input.completedThroughRound ?? 0,
    createdAt: input.createdAt,
  };
}

export function createPlanFromCandidate(
  candidate: PlanCandidate,
  parentPlan: Plan,
  planIndex: number,
  at: string,
): Plan {
  const capped = Math.min(
    parentPlan.completedThroughRound,
    candidate.generated.strategy.rounds.length,
  );
  const origin: PlanOrigin =
    candidate.source === 'improve'
      ? 'improve'
      : candidate.source === 'capital'
        ? 'capital'
        : candidate.source === 'scenario'
          ? 'scenario'
          : 'generate';

  return {
    id: crypto.randomUUID(),
    label: planLabel(planIndex),
    origin,
    parentPlanId: parentPlan.id,
    formValues: candidate.formValues,
    generated: candidate.generated,
    status: parentPlan.status === 'playing' ? 'playing' : 'ready',
    completedThroughRound: capped,
    createdAt: at,
  };
}

export interface CreateContinuationPlanInput {
  readonly parentPlan: Plan;
  readonly planIndex: number;
  readonly generated: GenerateResult;
  readonly formValues: PlannerFormValues;
  readonly at: string;
}

/** Entry thứ ba — API PlanFactory đóng băng sau S4. */
export function createContinuationPlan(input: CreateContinuationPlanInput): Plan {
  const capped = Math.min(
    input.parentPlan.completedThroughRound,
    input.generated.strategy.rounds.length,
  );
  return {
    id: crypto.randomUUID(),
    label: planLabel(input.planIndex),
    origin: 'continue',
    parentPlanId: input.parentPlan.id,
    formValues: input.formValues,
    generated: input.generated,
    status: 'playing',
    completedThroughRound: capped,
    createdAt: input.at,
  };
}

export function buildPlanAddedEvent(
  plan: Plan,
  at: string,
  label?: string,
): SessionTimelineEvent {
  return {
    at,
    type: 'plan-added',
    planId: plan.id,
    label: label ?? planOriginLabel(plan.origin),
    origin: plan.origin,
  };
}

export function supersedeParentPlan(parentPlan: Plan, at: string): Plan {
  if (parentPlan.status !== 'playing' && parentPlan.status !== 'ready') {
    return parentPlan;
  }
  return {
    ...parentPlan,
    status: 'superseded',
    finishedAt: at,
  };
}
