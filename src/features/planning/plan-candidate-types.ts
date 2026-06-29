import type { ImproveMode } from '@/features/improve/improve-service';
import type { GenerateResult, PlannerFormValues } from '@/features/planner/plan-service';
import type { CalculationRequest, StrategyStatistics } from '@stake/constraint-engine';

export type PlanCandidateSource = 'improve' | 'capital' | 'scenario';

export type PlanCandidateTarget = 'append-plan' | 'new-session';

export interface PlanCandidateSummary {
  readonly bankroll: number;
  readonly rounds: number;
  readonly profit: number;
  readonly maxBet: number;
}

export interface PlanCandidateBase {
  readonly candidateId: string;
  readonly target: PlanCandidateTarget;
  readonly source: PlanCandidateSource;
  readonly presetId: string;
  readonly calculation: CalculationRequest;
  readonly statistics: StrategyStatistics;
  readonly summary: PlanCandidateSummary;
  readonly formValues: PlannerFormValues;
  readonly generated: GenerateResult;
  readonly label: string;
  readonly recommendationId?: string;
  readonly createdAt: string;
}

export interface AppendPlanCandidate extends PlanCandidateBase {
  readonly target: 'append-plan';
  readonly sessionId: string;
  readonly parentPlanId: string;
  readonly mode?: ImproveMode;
}

export interface NewSessionPlanCandidate extends PlanCandidateBase {
  readonly target: 'new-session';
  readonly sessionId: null;
  readonly parentPlanId: null;
}

export type PlanCandidate = AppendPlanCandidate | NewSessionPlanCandidate;

export function isNewSessionCandidate(
  candidate: PlanCandidate,
): candidate is NewSessionPlanCandidate {
  return candidate.target === 'new-session';
}

export function isAppendPlanCandidate(
  candidate: PlanCandidate,
): candidate is AppendPlanCandidate {
  return candidate.target === 'append-plan';
}

export function buildCandidateSummary(generated: GenerateResult): PlanCandidateSummary {
  const { statistics, strategy } = generated;
  return {
    bankroll: statistics.requiredBankrollAmount,
    rounds: strategy.rounds.length,
    profit: statistics.expectedProfitAmount,
    maxBet: statistics.maximumBetAmount,
  };
}

export function createPlanCandidateFromImprove(input: {
  sessionId: string;
  parentPlanId: string;
  presetId: string;
  formValues: PlannerFormValues;
  generated: GenerateResult;
  label: string;
  mode: ImproveMode;
  createdAt: string;
}): AppendPlanCandidate {
  return {
    candidateId: crypto.randomUUID(),
    target: 'append-plan',
    sessionId: input.sessionId,
    parentPlanId: input.parentPlanId,
    presetId: input.presetId,
    source: 'improve',
    calculation: input.generated.request,
    statistics: input.generated.statistics,
    summary: buildCandidateSummary(input.generated),
    formValues: input.formValues,
    generated: input.generated,
    label: input.label,
    mode: input.mode,
    createdAt: input.createdAt,
  };
}

export function createPlanCandidateFromRecommendation(input: {
  recommendationId: string;
  presetId: string;
  source: PlanCandidateSource;
  formValues: PlannerFormValues;
  generated: GenerateResult;
  label: string;
  createdAt: string;
}): NewSessionPlanCandidate {
  return {
    candidateId: crypto.randomUUID(),
    target: 'new-session',
    sessionId: null,
    parentPlanId: null,
    presetId: input.presetId,
    source: input.source,
    recommendationId: input.recommendationId,
    calculation: input.generated.request,
    statistics: input.generated.statistics,
    summary: buildCandidateSummary(input.generated),
    formValues: input.formValues,
    generated: input.generated,
    label: input.label,
    createdAt: input.createdAt,
  };
}
