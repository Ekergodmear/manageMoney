import type { SafetyLevel } from '@/features/capital/capital-planner-types';
import type { Experiment } from '@/features/experiment/experiment-types';
import { DEFAULT_MARKET_ID } from '@/features/game-data/markets/market-definition';
import type {
  RecommendationSet,
  StrategyRecommendation,
} from '@/features/recommendation/recommendation-set-types';
import type { GenerateResult } from '@/features/planner/plan-service';
import { parseMoneyPositiveInt } from '@/lib/money-format';

function safetyLevel(required: number, budget: number): SafetyLevel {
  if (budget <= 0) {
    return 'tight';
  }
  const ratio = required / budget;
  if (ratio <= 0.75) {
    return 'safe';
  }
  if (ratio <= 0.95) {
    return 'tight';
  }
  return 'risky';
}

function toStrategyRecommendation(
  experiment: Experiment & { result: GenerateResult },
): StrategyRecommendation {
  const stats = experiment.result.statistics;
  const bankroll =
    parseMoneyPositiveInt(experiment.formValues.userBankroll) ?? stats.requiredBankrollAmount;
  return {
    recommendationId: experiment.id,
    label: experiment.label,
    marketId: experiment.formValues.marketId || DEFAULT_MARKET_ID,
    allocatedCapital: bankroll,
    targetProfit: stats.expectedProfitAmount,
    roundCount: stats.roundCount,
    requiredBankroll: stats.requiredBankrollAmount,
    maxBet: stats.maximumBetAmount,
    safety: safetyLevel(stats.requiredBankrollAmount, bankroll),
    formValues: experiment.formValues,
    generated: experiment.result,
  };
}

/** Lab experiments có kết quả → RecommendationSet (source=scenario). */
export function recommendationSetFromExperiments(
  experiments: readonly Experiment[],
  presetId: string,
  generatedAt: string,
): RecommendationSet | null {
  const withResult = experiments.filter(
    (e): e is Experiment & { result: GenerateResult } => e.result !== null,
  );
  if (withResult.length === 0) {
    return null;
  }

  const baseline = withResult.find((e) => e.isBaseline) ?? withResult[0];
  if (baseline === undefined) {
    return null;
  }
  const bankroll = parseMoneyPositiveInt(baseline.formValues.userBankroll) ?? 0;
  const recommendations = withResult.map(toStrategyRecommendation);
  const totalTargetProfit = recommendations.reduce((sum, r) => sum + r.targetProfit, 0);

  const marketId = baseline.formValues.marketId || DEFAULT_MARKET_ID;

  return {
    setId: crypto.randomUUID(),
    source: 'scenario',
    totalBankroll: bankroll,
    usableBankroll: bankroll,
    reserve: 0,
    strategy: 'balanced',
    risk: 'normal',
    presetId,
    marketId,
    recommendations,
    totalTargetProfit,
    selectedRecommendationId: null,
    generatedAt,
  };
}
