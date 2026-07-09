import { confidenceFromSampleSize } from '@/features/insights/insight-confidence';
import type { AggregatedInsightMetrics, InsightCard } from '@/features/insights/insight-types';

export function generateStrategyRecommendations(agg: AggregatedInsightMetrics): InsightCard[] {
  const cards: InsightCard[] = [];
  const confidence = confidenceFromSampleSize(agg.totalCompleted);

  if (agg.topPresetShare >= 85 && agg.topPresetName !== null && agg.totalCompleted >= 5) {
    cards.push({
      id: 'rec-diversify-games',
      layer: 'recommendation',
      emoji: '📈',
      title: 'Thử game khác',
      body: `${agg.topPresetName} chiếm ${String(agg.topPresetShare)}% phiên — khá tập trung.`,
      conclusion: '→ Mô phỏng game khác trong Lab trước khi chơi thật.',
      confidence,
      action: { label: 'Mở Scenario Planner', target: 'scenario' },
    });
  }

  return cards;
}
