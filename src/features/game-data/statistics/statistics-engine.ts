import type { MarketDefinition } from '@/features/game-data/markets/market-definition';
import type {
  DrawRecord,
  GameStatisticsSnapshot,
  StatisticsEngineOptions,
} from '@/features/game-data/statistics/statistics-types';
import { buildGameStatisticsSnapshot } from '@/features/game-data/statistics/snapshots';

/**
 * Game Statistics — mô tả lịch sử kết quả trò chơi.
 * Không biết React, Session, hay Collector HTTP.
 */
export class StatisticsEngine {
  compute(
    draws: readonly DrawRecord[],
    markets: readonly MarketDefinition[],
    options?: StatisticsEngineOptions,
  ): GameStatisticsSnapshot {
    return buildGameStatisticsSnapshot(draws, markets, options);
  }
}

export const gameStatisticsEngine = new StatisticsEngine();

export function computeGameStatistics(
  draws: readonly DrawRecord[],
  markets: readonly MarketDefinition[],
  options?: StatisticsEngineOptions,
): GameStatisticsSnapshot {
  return gameStatisticsEngine.compute(draws, markets, options);
}
