import type { MarketDefinition } from '@/features/game-data/markets/market-definition';
import { computeGameStatistics } from '@/features/game-data/statistics/statistics-engine';
import type { GameStatisticsSnapshot } from '@/features/game-data/statistics/statistics-types';
import type { DrawRepository } from '@/features/game-data/statistics/repositories/draw-repository';

export interface LoadGameStatisticsInput {
  readonly markets: readonly MarketDefinition[];
  readonly recentLimit?: number;
}

/** Facade: DrawRepository → StatisticsEngine → Snapshot. */
export class StatisticsRepository {
  constructor(private readonly draws: DrawRepository) {}

  async loadRecentSnapshot(input: LoadGameStatisticsInput): Promise<GameStatisticsSnapshot | null> {
    const limit = input.recentLimit ?? 1000;
    const records = await this.draws.loadRecent(limit);
    if (records.length === 0) {
      return null;
    }
    return computeGameStatistics(records, input.markets);
  }

  async loadBetweenSnapshot(
    input: LoadGameStatisticsInput & { readonly from: Date; readonly to: Date },
  ): Promise<GameStatisticsSnapshot | null> {
    const records = await this.draws.loadBetween(input.from, input.to);
    if (records.length === 0) {
      return null;
    }
    return computeGameStatistics(records, input.markets);
  }
}
