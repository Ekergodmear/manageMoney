import type { CollectorState } from '../types/collector-state.js';
import type { DrawResult } from '../types/draw-result.js';

/** Append-only draw persistence — no UPDATE/DELETE on draw rows. */
export interface DrawSink {
  append(draw: DrawResult): Promise<void>;
  appendMany(draws: readonly DrawResult[]): Promise<void>;
  findLatest(): Promise<DrawResult | null>;
  findByDrawKey(drawKey: string): Promise<DrawResult | null>;
  count(): Promise<number>;
  getLastDrawKey(): Promise<string | null>;
  getTodayDrawRows(
    datePrefix: string,
  ): Promise<readonly { total: number; flower: string | null }[]>;
  /** Chronological order (oldest first). */
  findRecent(limit: number): Promise<readonly DrawResult[]>;
  /** Inclusive ISO range on draw_at, chronological order. */
  findBetween(fromIso: string, toIso: string): Promise<readonly DrawResult[]>;
  loadCollectorState(): Promise<CollectorState>;
  saveCollectorState(state: CollectorState): Promise<void>;
  close(): Promise<void>;
}
