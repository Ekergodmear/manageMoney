import { generateCapitalRecommendations } from '@/features/insights/insight-generators/capital';
import { generateGameStatisticsInsights } from '@/features/insights/insight-generators/game-statistics';
import { buildInsightsUpdatedMeta } from '@/features/insights/insight-confidence';
import { generateOutliers } from '@/features/insights/insight-generators/outlier';
import { generateReflection } from '@/features/insights/insight-generators/reflection';
import { generateSessionRecommendations } from '@/features/insights/insight-generators/recommendation';
import { generateStrategyRecommendations } from '@/features/insights/insight-generators/strategy';
import { generateTrends } from '@/features/insights/insight-generators/trend';
import {
  aggregateMetrics,
  buildSessionMetrics,
  generateQuickSessionInsights,
  generateRecords,
  insightsEligibleSessions,
  strategyQuickInsight,
} from '@/features/insights/insight-generators/session';
import type {
  InsightCard,
  InsightEngineInput,
  InsightsSnapshot,
} from '@/features/insights/insight-types';

export function generateInsights(input: InsightEngineInput): InsightsSnapshot {
  const eligible = insightsEligibleSessions(input.sessions);
  const metrics = buildSessionMetrics(eligible, input.presets);
  const agg = aggregateMetrics(metrics);

  const reflection = generateReflection(metrics, agg, input.capitalPlanner);

  const strategyQuick = strategyQuickInsight(agg, input.capitalPlanner);
  const gameStatCards = generateGameStatisticsInsights(input.gameStatistics);
  const quick = [
    ...generateQuickSessionInsights(agg, metrics),
    ...gameStatCards.filter((c) => c.layer === 'quick'),
    ...(strategyQuick !== null ? [strategyQuick] : []),
  ];

  const recommendations = dedupeRecommendations([
    ...generateSessionRecommendations(agg, metrics),
    ...generateCapitalRecommendations(agg),
    ...generateStrategyRecommendations(agg),
  ]).slice(0, 4);

  return {
    reflection,
    quick,
    observations: gameStatCards.filter((c) => c.layer === 'trend'),
    recommendations,
    outliers: generateOutliers(metrics),
    trends: generateTrends(metrics),
    records: generateRecords(metrics),
    updated: buildInsightsUpdatedMeta(metrics),
    hasData: eligible.length > 0 || gameStatCards.length > 0,
  };
}

function dedupeRecommendations(cards: InsightCard[]): InsightCard[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    if (seen.has(card.id)) {
      return false;
    }
    seen.add(card.id);
    return true;
  });
}
