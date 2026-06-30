import type { DrawRecord } from '@/features/game-data/statistics/statistics-types';

/** Read-only draw history — implementation gọi Collector HTTP hoặc in-memory test double. */
export interface DrawRepository {
  loadBetween(from: Date, to: Date): Promise<readonly DrawRecord[]>;
  loadRecent(limit: number): Promise<readonly DrawRecord[]>;
}
