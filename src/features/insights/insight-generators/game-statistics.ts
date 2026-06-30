import type { GameStatisticsSnapshot } from '@/features/game-data/statistics/statistics-types';
import type { InsightCard } from '@/features/insights/insight-types';
import {
  formatHitRateDelta,
  formatVariance,
} from '@/features/game-data/statistics/statistics-format';
import { formatPercent } from '@/features/planner/plan-display';

const DISCLAIMER = 'Đây chỉ là quan sát lịch sử, không làm thay đổi xác suất của kỳ tiếp theo.';

export function generateGameStatisticsInsights(
  snapshot: GameStatisticsSnapshot | null | undefined,
): InsightCard[] {
  if (snapshot === null || snapshot === undefined || snapshot.totalDraws < 50) {
    return [];
  }

  const cards: InsightCard[] = [];

  const topVariance = [...snapshot.markets].sort((a, b) => b.variance - a.variance)[0];
  if (topVariance !== undefined && topVariance.variance > 0.5) {
    const pctOver =
      topVariance.expectedCount > 0
        ? Math.round((topVariance.variance / topVariance.expectedCount) * 100)
        : 0;
    cards.push({
      id: 'game-stat-variance-high',
      layer: 'trend',
      emoji: '📊',
      title: `${topVariance.label} xuất hiện nhiều hơn kỳ vọng`,
      body: `Trong ${String(snapshot.totalDraws)} kỳ gần nhất, ${topVariance.label} xuất hiện ${String(topVariance.observedCount)} lần (kỳ vọng ${formatVariance(topVariance.expectedCount)}).`,
      conclusion:
        pctOver > 0
          ? `→ Cao hơn kỳ vọng khoảng ${String(pctOver)}%. ${DISCLAIMER}`
          : `→ ${DISCLAIMER}`,
    });
  }

  const topDrought = [...snapshot.markets].sort((a, b) => b.drought - a.drought)[0];
  if (topDrought !== undefined && topDrought.drought >= 100) {
    cards.push({
      id: `game-stat-drought-${topDrought.marketId}`,
      layer: 'trend',
      emoji: '⏳',
      title: `${topDrought.label} đã vắng ${String(topDrought.drought)} kỳ`,
      body: `Hit rate lý thuyết ${formatPercent(topDrought.expectedHitRate * 100)}% — thực tế ${formatPercent(topDrought.actualHitRate * 100)}% trong cửa sổ này.`,
      conclusion: `→ ${DISCLAIMER}`,
    });
  }

  if (snapshot.hotCold.hot !== null && snapshot.hotCold.hot.hitRateDelta > 0.002) {
    cards.push({
      id: 'game-stat-hot-observe',
      layer: 'quick',
      emoji: '🔥',
      title: `${snapshot.hotCold.hot.label} hit rate cao hơn lý thuyết`,
      body: `Chênh lệch ${formatHitRateDelta(snapshot.hotCold.hot.hitRateDelta)} trong ${String(snapshot.totalDraws)} kỳ.`,
      conclusion: `→ ${DISCLAIMER}`,
    });
  }

  return cards.slice(0, 3);
}
