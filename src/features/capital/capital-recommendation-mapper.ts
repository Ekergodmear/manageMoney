import type {
  CapitalPlannerResult,
  CapitalSessionRecommendation,
} from '@/features/capital/capital-planner-types';
import { DEFAULT_MARKET_ID } from '@/features/game-data/markets/market-definition';
import type {
  RecommendationSet,
  StrategyRecommendation,
} from '@/features/recommendation/recommendation-set-types';

type LegacyStrategyRecommendation = Omit<StrategyRecommendation, 'marketId'> & {
  readonly marketId?: string;
};

type LegacyRecommendationSet = Omit<RecommendationSet, 'marketId' | 'recommendations'> & {
  readonly marketId?: string;
  readonly recommendations: readonly LegacyStrategyRecommendation[];
};

function toStrategyRecommendation(rec: CapitalSessionRecommendation): StrategyRecommendation {
  return {
    recommendationId: rec.id,
    label: rec.label,
    marketId: rec.marketId,
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
    marketId: result.marketId,
    recommendations: result.recommendations.map(toStrategyRecommendation),
    totalTargetProfit: result.totalTargetProfit,
    selectedRecommendationId: null,
    generatedAt,
  };
}

export function normalizeRecommendationSet(raw: LegacyRecommendationSet): RecommendationSet {
  const marketId =
    raw.marketId ??
    raw.recommendations[0]?.marketId ??
    raw.recommendations[0]?.formValues.marketId ??
    DEFAULT_MARKET_ID;
  return {
    ...raw,
    marketId,
    recommendations: raw.recommendations.map((rec) => ({
      ...rec,
      marketId: rec.marketId ?? rec.formValues.marketId,
    })),
  };
}
