import type { CollectorState } from '../types/collector-state.js';
import type { DrawResult } from '../types/draw-result.js';

export interface AppendResult {
  readonly inserted: number;
  readonly skipped: number;
}

/** Append-only draw persistence — no UPDATE/DELETE on draw rows. */
export interface DrawSink {
  append(draw: DrawResult): Promise<AppendResult>;
  appendMany(draws: readonly DrawResult[]): Promise<AppendResult>;
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
  /** Inclusive draw_key range (YYYYMMDDHHmmss), chronological order. */
  findBetweenDrawKeys(fromKey: string, toKey: string): Promise<readonly DrawResult[]>;
  /** Exact calendar day via draw_key prefix YYYYMMDD. */
  findByGameDay(dayCompact: string): Promise<readonly DrawResult[]>;
  /** Draw counts keyed by YYYY-MM-DD (game TZ via draw_key). */
  countByGameDay(): Promise<Readonly<Record<string, number>>>;
  /** Dev cleanup when adapter changes — not used on normal ingest. */
  purgeDrawsNotFromSource(source: string): Promise<number>;
  loadCollectorState(): Promise<CollectorState>;
  saveCollectorState(state: CollectorState): Promise<void>;
  close(): Promise<void>;
}
