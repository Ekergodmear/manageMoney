import type { MarketDefinition } from '@/features/game-data/markets/market-definition';
import type {
  DrawRecord,
  GameStatisticsSnapshot,
  MarketFrequencyStat,
  MarketRankings,
  HotColdSnapshot,
  StatisticsEngineOptions,
} from '@/features/game-data/statistics/statistics-types';
import { DEFAULT_ROLLING_WINDOW_SIZES } from '@/features/game-data/statistics/statistics-types';
import {
  buildMarketFrequencyStats,
  computeRollingWindow,
} from '@/features/game-data/statistics/rolling-window';

function buildDistributions(draws: readonly DrawRecord[]): GameStatisticsSnapshot['distributions'] {
  const totalCounts = new Map<number, number>();
  const flowerCounts = new Map<string, number>();
  const sizeCounts = new Map<string, number>();

  for (const draw of draws) {
    totalCounts.set(draw.total, (totalCounts.get(draw.total) ?? 0) + 1);
    if (draw.flower !== null) {
      flowerCounts.set(draw.flower, (flowerCounts.get(draw.flower) ?? 0) + 1);
    }
    sizeCounts.set(draw.smallLarge, (sizeCounts.get(draw.smallLarge) ?? 0) + 1);
  }

  const totals = [...totalCounts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([total, count]) => ({
      key: String(total),
      label: String(total),
      count,
    }));

  const flowers = [...flowerCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([flower, count]) => ({
      key: flower,
      label: flower,
      count,
    }));

  const sizeLabels: Record<string, string> = {
    small: 'Xỉu',
    tie: 'Hòa',
    large: 'Tài',
  };

  const sizes = [...sizeCounts.entries()].map(([size, count]) => ({
    key: size,
    label: sizeLabels[size] ?? size,
    count,
  }));

  return { totals, flowers, sizes };
}

function buildRankings(markets: readonly MarketFrequencyStat[]): MarketRankings {
  const byFrequency = [...markets]
    .sort((a, b) => b.observedCount - a.observedCount)
    .map((m) => m.marketId);
  const byVariance = [...markets].sort((a, b) => b.variance - a.variance).map((m) => m.marketId);
  const byDrought = [...markets].sort((a, b) => b.drought - a.drought).map((m) => m.marketId);
  return { byFrequency, byVariance, byDrought };
}

function buildHotCold(markets: readonly MarketFrequencyStat[]): HotColdSnapshot {
  if (markets.length === 0) {
    return { hot: null, cold: null };
  }

  const hotCandidate = [...markets].sort((a, b) => b.hitRateDelta - a.hitRateDelta)[0];
  const coldCandidate = [...markets].sort((a, b) => b.drought - a.drought)[0];

  return {
    hot:
      hotCandidate !== undefined && hotCandidate.hitRateDelta > 0
        ? {
            marketId: hotCandidate.marketId,
            label: hotCandidate.label,
            hitRateDelta: hotCandidate.hitRateDelta,
          }
        : null,
    cold:
      coldCandidate !== undefined && coldCandidate.drought > 0
        ? {
            marketId: coldCandidate.marketId,
            label: coldCandidate.label,
            drought: coldCandidate.drought,
          }
        : null,
  };
}

export function buildGameStatisticsSnapshot(
  draws: readonly DrawRecord[],
  markets: readonly MarketDefinition[],
  options: StatisticsEngineOptions = {},
): GameStatisticsSnapshot {
  const generatedAt = new Date().toISOString();
  const rollingSizes = options.rollingWindowSizes ?? DEFAULT_ROLLING_WINDOW_SIZES;
  const marketStats = buildMarketFrequencyStats(draws, markets);
  const rollingWindows = rollingSizes.map((size) => computeRollingWindow(draws, markets, size));

  return {
    generatedAt,
    totalDraws: draws.length,
    fromDrawAt: draws[0]?.drawAt ?? null,
    toDrawAt: draws[draws.length - 1]?.drawAt ?? null,
    markets: marketStats,
    rollingWindows,
    rankings: buildRankings(marketStats),
    distributions: buildDistributions(draws),
    hotCold: buildHotCold(marketStats),
  };
}
