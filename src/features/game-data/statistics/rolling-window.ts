import type { MarketDefinition } from '@/features/game-data/markets/market-definition';
import type {
  DrawRecord,
  MarketFrequencyStat,
  RollingWindowSnapshot,
} from '@/features/game-data/statistics/statistics-types';
import {
  actualHitRate,
  expectedCount,
  frequencyVariance,
  hitRateDelta,
  marketExpectedHitRate,
} from '@/features/game-data/statistics/probability';
import { computeMarketStreak, countMarketHits } from '@/features/game-data/statistics/streaks';

function buildMarketStat(
  market: MarketDefinition,
  draws: readonly DrawRecord[],
): MarketFrequencyStat {
  const totalDraws = draws.length;
  const observedCount = countMarketHits(draws, market);
  const expected = expectedCount(market.probability, totalDraws);
  const expectedRate = marketExpectedHitRate(market);
  const actualRate = actualHitRate(observedCount, totalDraws);
  const streak = computeMarketStreak(draws, market);

  return {
    marketId: market.id,
    label: market.label,
    observedCount,
    expectedCount: expected,
    variance: frequencyVariance(observedCount, expected),
    expectedHitRate: expectedRate,
    actualHitRate: actualRate,
    hitRateDelta: hitRateDelta(actualRate, expectedRate),
    drought: streak.drought,
    lastSeenAt: streak.lastSeenAt,
    lastSeenDrawsAgo: streak.lastSeenDrawsAgo,
  };
}

export function sliceRecentDraws(
  draws: readonly DrawRecord[],
  windowSize: number,
): readonly DrawRecord[] {
  if (draws.length <= windowSize) {
    return draws;
  }
  return draws.slice(draws.length - windowSize);
}

export function computeRollingWindow(
  draws: readonly DrawRecord[],
  markets: readonly MarketDefinition[],
  windowSize: number,
): RollingWindowSnapshot {
  const slice = sliceRecentDraws(draws, windowSize);
  return {
    windowSize,
    drawCount: slice.length,
    markets: markets.map((m) => buildMarketStat(m, slice)),
  };
}

export function buildMarketFrequencyStats(
  draws: readonly DrawRecord[],
  markets: readonly MarketDefinition[],
): readonly MarketFrequencyStat[] {
  return markets.map((m) => buildMarketStat(m, draws));
}
