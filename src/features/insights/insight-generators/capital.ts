import { confidenceFromSampleSize } from '@/features/insights/insight-confidence';
import type { AggregatedInsightMetrics, InsightCard } from '@/features/insights/insight-types';

export function generateCapitalRecommendations(agg: AggregatedInsightMetrics): InsightCard[] {
  const cards: InsightCard[] = [];
  const confidence = confidenceFromSampleSize(agg.totalCompleted);

  if (agg.avgCapitalUsage !== null && agg.avgCapitalUsage < 60 && agg.totalCompleted >= 3) {
    cards.push({
      id: 'rec-low-capital-usage',
      layer: 'recommendation',
      emoji: '💰',
      title: 'Vốn đang nhàn rỗi',
      body: `Capital Usage trung bình chỉ ${String(agg.avgCapitalUsage)}% qua ${String(agg.totalCompleted)} phiên.`,
      conclusion: '→ Phân bổ lại vốn hoặc tăng target trước phiên mới.',
      confidence,
      action: { label: 'Mở Capital Planner', target: 'capital' },
    });
  }

  if (agg.avgCapitalUsage !== null && agg.avgCapitalUsage > 92 && agg.totalCompleted >= 3) {
    cards.push({
      id: 'rec-high-capital-usage',
      layer: 'recommendation',
      emoji: '⚠️',
      title: 'Vốn gần cạn',
      body: `Capital Usage trung bình ${String(agg.avgCapitalUsage)}% — bạn thường dùng gần hết vốn kế hoạch.`,
      conclusion: '→ Tăng bankroll hoặc giảm target trước phiên tiếp theo.',
      confidence,
      action: { label: 'Mở Capital Planner', target: 'capital' },
    });
  }

  return cards;
}
