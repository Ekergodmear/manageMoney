import type { MarketDefinition } from '@/features/game-data/markets/market-definition';
import { marketMatchesDraw } from '@/features/game-data/markets/market-resolver';
import type { DrawRecord } from '@/features/game-data/statistics/statistics-types';
import { drawRecordToSnapshot } from '@/features/game-data/statistics/draw-record';

export interface MarketStreakInfo {
  readonly drought: number;
  readonly lastSeenAt: string | null;
  readonly lastSeenDrawsAgo: number | null;
}

/** Drought = số kỳ từ lần hit gần nhất đến kỳ mới nhất (0 nếu hit ở kỳ cuối). */
export function computeMarketStreak(
  draws: readonly DrawRecord[],
  market: MarketDefinition,
): MarketStreakInfo {
  if (draws.length === 0) {
    return { drought: 0, lastSeenAt: null, lastSeenDrawsAgo: null };
  }

  let drought = draws.length;
  let lastSeenAt: string | null = null;
  let lastSeenDrawsAgo: number | null = null;

  for (let i = draws.length - 1; i >= 0; i--) {
    const draw = draws[i];
    if (draw === undefined) {
      continue;
    }
    const snapshot = drawRecordToSnapshot(draw);
    if (marketMatchesDraw(market, snapshot)) {
      lastSeenAt = draw.drawAt;
      lastSeenDrawsAgo = draws.length - 1 - i;
      drought = lastSeenDrawsAgo;
      break;
    }
  }

  if (lastSeenAt === null) {
    drought = draws.length;
  }

  return { drought, lastSeenAt, lastSeenDrawsAgo };
}

export function countMarketHits(draws: readonly DrawRecord[], market: MarketDefinition): number {
  let count = 0;
  for (const draw of draws) {
    if (marketMatchesDraw(market, drawRecordToSnapshot(draw))) {
      count++;
    }
  }
  return count;
}
