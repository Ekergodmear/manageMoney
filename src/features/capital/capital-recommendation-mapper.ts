import type { CapitalPlannerResult, CapitalSessionRecommendation } from '@/features/capital/capital-planner-types';
import type {
  RecommendationSet,
  StrategyRecommendation,
} from '@/features/recommendation/recommendation-set-types';

function toStrategyRecommendation(rec: CapitalSessionRecommendation): StrategyRecommendation {
  return {
    recommendationId: rec.id,
    label: rec.label,
    allocatedCapital: rec.allocatedCapital,
    targetProfit: rec.targetProfit,
    roundCount: rec.roundCount,
    requiredBankroll: rec.requiredBankroll,
    maxBet: rec.maxBet,
    safety: rec.safety,
    formValues: rec.formValues,
    generated: rec.result,
  };
}

/** Engine output → aggregate persist + UI. */
export function recommendationSetFromCapitalResult(
  result: CapitalPlannerResult,
  generatedAt: string,
): RecommendationSet {
  return {
    setId: crypto.randomUUID(),
    source: 'capital',
    totalBankroll: result.totalBankroll,
    usableBankroll: result.usableBankroll,
    reserve: result.reserve,
    strategy: result.strategy,
    risk: result.risk,
    presetId: result.presetId,
    recommendations: result.recommendations.map(toStrategyRecommendation),
    totalTargetProfit: result.totalTargetProfit,
    selectedRecommendationId: null,
    generatedAt,
  };
}
