import {
  confidenceFromSampleSize,
  mostRecentLostSession,
  sessionWithMostContinues,
} from '@/features/insights/insight-confidence';
import type {
  AggregatedInsightMetrics,
  InsightCard,
  SessionInsightMetrics,
} from '@/features/insights/insight-types';

export function generateSessionRecommendations(
  agg: AggregatedInsightMetrics,
  metrics: readonly SessionInsightMetrics[],
): InsightCard[] {
  const cards: InsightCard[] = [];
  const confidence = confidenceFromSampleSize(agg.totalCompleted);

  if (
    agg.avgRoundsBeforeContinue !== null &&
    agg.avgRoundsBeforeContinue >= 300 &&
    agg.avgContinue >= 1 &&
    agg.totalCompleted >= 3
  ) {
    const suggestedRounds = Math.round(agg.avgRoundsBeforeContinue * 1.45);
    cards.push({
      id: 'rec-longer-initial-plan',
      layer: 'recommendation',
      emoji: '🎯',
      title: 'Kế hoạch dài hơn',
      body: `Bạn thường Continue sau khoảng ${String(agg.avgRoundsBeforeContinue)} vòng.`,
      conclusion: `→ Thử tạo kế hoạch ~${String(suggestedRounds)} vòng ngay từ đầu.`,
      confidence,
      action: { label: 'Mở Scenario Planner', target: 'scenario' },
    });
  } else if (agg.avgContinue >= 2.5 && agg.totalCompleted >= 3) {
    const exemplar = sessionWithMostContinues(metrics);
    cards.push({
      id: 'rec-continue-heavy',
      layer: 'recommendation',
      emoji: '↩️',
      title: 'Giảm số lần Continue',
      body: `Trung bình ${String(agg.avgContinue)} Continue/phiên — pattern lặp lại qua ${String(agg.totalCompleted)} phiên.`,
      conclusion: '→ Mô phỏng kế hoạch dài hơn trước khi chơi thật.',
      confidence,
      action:
        exemplar !== null
          ? {
              label: 'Mở Session',
              target: 'session',
              sessionId: exemplar.session.id,
            }
          : { label: 'Mở Scenario Planner', target: 'scenario' },
    });
  }

  const winRate =
    agg.totalCompleted > 0 ? Math.round((agg.winCount / agg.totalCompleted) * 100) : 0;
  if (agg.totalCompleted >= 5 && winRate < 40) {
    const lost = mostRecentLostSession(metrics);
    cards.push({
      id: 'rec-low-win-rate',
      layer: 'recommendation',
      emoji: '📉',
      title: 'Phiên thua gần nhất',
      body: `Chỉ ${String(winRate)}% phiên thắng — đáng xem lại phiên thua gần nhất.`,
      conclusion: '→ So sánh plan ban đầu với phiên thắng trong Library.',
      confidence,
      action:
        lost !== null
          ? {
              label: 'Mở Session',
              target: 'session',
              sessionId: lost.session.id,
            }
          : { label: 'Mở Session Library', target: 'library' },
    });
  }

  return cards;
}
