import type {
  CapitalGoal,
  RiskProfile,
  SafetyLevel,
} from '@/features/capital/capital-planner-types';
import type { GenerateResult, PlannerFormValues } from '@/features/planner/plan-service';

export type RecommendationSource = 'capital' | 'scenario';

/** Đề xuất chiến lược — chưa phải Candidate. */
export interface StrategyRecommendation {
  readonly recommendationId: string;
  readonly label: string;
  readonly allocatedCapital: number;
  readonly targetProfit: number;
  readonly roundCount: number;
  readonly requiredBankroll: number;
  readonly maxBet: number;
  readonly safety: SafetyLevel;
  readonly formValues: PlannerFormValues;
  readonly generated: GenerateResult;
}

/** Một lần generate — nhiều recommendation, một nguồn sự thật cho UI. */
export interface RecommendationSet {
  readonly setId: string;
  readonly source: RecommendationSource;
  readonly totalBankroll: number;
  readonly usableBankroll: number;
  readonly reserve: number;
  readonly strategy: CapitalGoal;
  readonly risk: RiskProfile;
  readonly presetId: string;
  readonly recommendations: readonly StrategyRecommendation[];
  readonly totalTargetProfit: number;
  readonly selectedRecommendationId: string | null;
  readonly generatedAt: string;
}

export function findRecommendation(
  set: RecommendationSet,
  recommendationId: string,
): StrategyRecommendation | undefined {
  return set.recommendations.find((r) => r.recommendationId === recommendationId);
}
