import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  initialCollectorState,
  type CollectorState,
  type CollectorStatus,
  type ResumeState,
} from '../types/collector-state.js';
import type { DrawResult, RawHttpResponse } from '../types/draw-result.js';
import { isSqliteBusyError, withSqliteRetry } from '../util/retry.js';
import type { AppendResult, DrawSink } from './draw-sink.js';

const packageDir = dirname(fileURLToPath(import.meta.url));

function drawToParams(draw: DrawResult): Record<string, unknown> {
  return {
    drawKey: draw.drawKey,
    gameId: draw.gameId,
    marketVersion: draw.marketVersion,
    drawAt: draw.drawAt,
    publishedAt: draw.publishedAt,
    publishedEstimated: draw.publishedEstimated ? 1 : 0,
    collectedAt: draw.collectedAt,
    latencyMs: draw.latencyMs,
    d1: draw.dice[0],
    d2: draw.dice[1],
    d3: draw.dice[2],
    total: draw.total,
    flower: draw.flower,
    smallLarge: draw.smallLarge,
    source: draw.source,
    rawPayload: JSON.stringify(draw.rawPayload),
    rawResponse: draw.rawResponse !== null ? JSON.stringify(draw.rawResponse) : null,
  };
}

function rowToDraw(row: Record<string, unknown>): DrawResult {
  let rawResponse: RawHttpResponse | null = null;
  const rawResponseJson = row['rawResponse'] as string | null;
  if (rawResponseJson !== null) {
    try {
      rawResponse = JSON.parse(rawResponseJson) as RawHttpResponse;
    } catch {
      rawResponse = null;
    }
  }

  return {
    drawKey: row['drawKey'] as string,
    gameId: row['gameId'] as string,
    marketVersion: row['marketVersion'] as number,
    drawAt: row['drawAt'] as string,
    publishedAt: row['publishedAt'] as string,
    publishedEstimated: (row['publishedEstimated'] as number) === 1,
    collectedAt: row['collectedAt'] as string,
    latencyMs: row['latencyMs'] as number,
    dice: [row['d1'] as number, row['d2'] as number, row['d3'] as number],
    total: row['total'] as number,
    flower: (row['flower'] as string | null) ?? null,
    smallLarge: row['smallLarge'] as DrawResult['smallLarge'],
    source: row['source'] as string,
    rawPayload: JSON.parse(row['rawPayload'] as string) as unknown,
    rawResponse,
  };
}

const SELECT_DRAW_COLUMNS = `
  draw_key AS drawKey, game_id AS gameId, market_version AS marketVersion,
  draw_at AS drawAt, published_at AS publishedAt,
  published_estimated AS publishedEstimated, collected_at AS collectedAt,
  latency_ms AS latencyMs, dice_1 AS d1, dice_2 AS d2, dice_3 AS d3,
  total, flower, small_large AS smallLarge, source,
  raw_payload AS rawPayload, raw_response AS rawResponse
`;

function isUniqueConstraintError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const code = (err as { code?: string }).code;
  return code === 'SQLITE_CONSTRAINT_UNIQUE' || code === 'SQLITE_CONSTRAINT';
}

function parseResumeState(value: string | undefined): ResumeState {
  if (value === 'resumed' || value === 'catch-up' || value === 'fresh') {
    return value;
  }
  return 'fresh';
}

export class SqliteDrawSink implements DrawSink {
  private readonly db: Database.Database;
  private readonly insertDrawIgnore: Database.Statement;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('busy_timeout = 5000');
    const schemaPath = join(packageDir, '..', '..', 'schema.sql');
    this.db.exec(readFileSync(schemaPath, 'utf8'));
    const insertColumns = `
        draw_key, game_id, market_version, draw_at, published_at,
        published_estimated, collected_at, latency_ms, dice_1, dice_2, dice_3,
        total, flower, small_large, source, raw_payload, raw_response`;
    const insertValues = `
        @drawKey, @gameId, @marketVersion, @drawAt, @publishedAt,
        @publishedEstimated, @collectedAt, @latencyMs, @d1, @d2, @d3,
        @total, @flower, @smallLarge, @source, @rawPayload, @rawResponse`;
    this.insertDrawIgnore = this.db.prepare(
      `INSERT OR IGNORE INTO draw_results (${insertColumns}) VALUES (${insertValues})`,
    );
    this.ensureCollectorStateSchema();
  }

  private ensureCollectorStateSchema(): void {
    const columns = this.db.prepare(`PRAGMA table_info(collector_state)`).all() as Array<{
      name: string;
    }>;
    const names = new Set(columns.map((column) => column.name));
    if (!names.has('duplicates_skipped')) {
      this.db.exec(
        `ALTER TABLE collector_state ADD COLUMN duplicates_skipped INTEGER NOT NULL DEFAULT 0`,
      );
    }
    if (!names.has('resume_state')) {
      this.db.exec(
        `ALTER TABLE collector_state ADD COLUMN resume_state TEXT NOT NULL DEFAULT 'fresh'`,
      );
    }
    if (!names.has('catch_up_count')) {
      this.db.exec(
        `ALTER TABLE collector_state ADD COLUMN catch_up_count INTEGER NOT NULL DEFAULT 0`,
      );
    }
    if (!names.has('resumed_from_draw_key')) {
      this.db.exec(`ALTER TABLE collector_state ADD COLUMN resumed_from_draw_key TEXT`);
    }
  }

  private countInsertResult(changes: number): AppendResult {
    return {
      inserted: changes,
      skipped: changes === 0 ? 1 : 0,
    };
  }
  async append(draw: DrawResult): Promise<AppendResult> {
    return withSqliteRetry(() => {
      const result = this.insertDrawIgnore.run(drawToParams(draw));
      return this.countInsertResult(result.changes);
    });
  }

  async appendMany(draws: readonly DrawResult[]): Promise<AppendResult> {
    if (draws.length === 0) {
      return { inserted: 0, skipped: 0 };
    }
    return withSqliteRetry(() => {
      let inserted = 0;
      let skipped = 0;
      const runBatch = this.db.transaction((items: readonly DrawResult[]) => {
        for (const draw of items) {
          const result = this.insertDrawIgnore.run(drawToParams(draw));
          if (result.changes > 0) {
            inserted += 1;
          } else {
            skipped += 1;
          }
        }
      });
      runBatch(draws);
      return { inserted, skipped };
    });
  }

  findLatest(): Promise<DrawResult | null> {
    const row = this.db
      .prepare(`SELECT ${SELECT_DRAW_COLUMNS} FROM draw_results ORDER BY draw_at DESC LIMIT 1`)
      .get() as Record<string, unknown> | undefined;
    return Promise.resolve(row !== undefined ? rowToDraw(row) : null);
  }

  findByDrawKey(drawKey: string): Promise<DrawResult | null> {
    const row = this.db
      .prepare(`SELECT ${SELECT_DRAW_COLUMNS} FROM draw_results WHERE draw_key = ?`)
      .get(drawKey) as Record<string, unknown> | undefined;
    return Promise.resolve(row !== undefined ? rowToDraw(row) : null);
  }

  count(): Promise<number> {
    const row = this.db.prepare(`SELECT COUNT(*) AS c FROM draw_results`).get() as {
      c: number;
    };
    return Promise.resolve(row.c);
  }

  async getLastDrawKey(): Promise<string | null> {
    const latest = await this.findLatest();
    return latest?.drawKey ?? null;
  }

  getTodayDrawRows(
    datePrefix: string,
  ): Promise<readonly { total: number; flower: string | null }[]> {
    const like = `${datePrefix}%`;
    const rows = this.db
      .prepare(`SELECT total, flower FROM draw_results WHERE draw_at LIKE ? ORDER BY draw_at ASC`)
      .all(like) as Array<{ total: number; flower: string | null }>;
    return Promise.resolve(rows);
  }

  findRecent(limit: number): Promise<readonly DrawResult[]> {
    const capped = Math.max(1, Math.min(limit, 50_000));
    const rows = this.db
      .prepare(`SELECT ${SELECT_DRAW_COLUMNS} FROM draw_results ORDER BY draw_at DESC LIMIT ?`)
      .all(capped) as Array<Record<string, unknown>>;
    return Promise.resolve(rows.map(rowToDraw).reverse());
  }

  findBetween(fromIso: string, toIso: string): Promise<readonly DrawResult[]> {
    const rows = this.db
      .prepare(
        `SELECT ${SELECT_DRAW_COLUMNS} FROM draw_results
         WHERE draw_at >= ? AND draw_at <= ?
         ORDER BY draw_at ASC`,
      )
      .all(fromIso, toIso) as Array<Record<string, unknown>>;
    return Promise.resolve(rows.map(rowToDraw));
  }

  findBetweenDrawKeys(fromKey: string, toKey: string): Promise<readonly DrawResult[]> {
    const rows = this.db
      .prepare(
        `SELECT ${SELECT_DRAW_COLUMNS} FROM draw_results
         WHERE draw_key >= ? AND draw_key <= ?
         ORDER BY draw_key ASC`,
      )
      .all(fromKey, toKey) as Array<Record<string, unknown>>;
    return Promise.resolve(rows.map(rowToDraw));
  }

  findByGameDay(dayCompact: string): Promise<readonly DrawResult[]> {
    const rows = this.db
      .prepare(
        `SELECT ${SELECT_DRAW_COLUMNS} FROM draw_results
         WHERE substr(draw_key, 1, 8) = ?
         ORDER BY draw_key ASC`,
      )
      .all(dayCompact) as Array<Record<string, unknown>>;
    return Promise.resolve(rows.map(rowToDraw));
  }

  countByGameDay(): Promise<Readonly<Record<string, number>>> {
    const rows = this.db
      .prepare(
        `SELECT substr(draw_key, 1, 4) || '-' || substr(draw_key, 5, 2) || '-' || substr(draw_key, 7, 2) AS day_key,
                COUNT(*) AS c
         FROM draw_results
         GROUP BY day_key
         ORDER BY day_key ASC`,
      )
      .all() as Array<{ day_key: string; c: number }>;
    const out: Record<string, number> = {};
    for (const row of rows) {
      out[row.day_key] = row.c;
    }
    return Promise.resolve(out);
  }

  loadCollectorState(): Promise<CollectorState> {
    const row = this.db
      .prepare(
        `SELECT last_draw_key AS lastDrawKey, last_draw_json AS lastDrawJson,
                last_success_at AS lastSuccessAt, last_poll_at AS lastPollAt,
                failure_count AS failureCount, average_latency_ms AS averageLatencyMs,
                duplicates_skipped AS duplicatesSkipped,
                resume_state AS resumeState,
                catch_up_count AS catchUpCount,
                resumed_from_draw_key AS resumedFromDrawKey,
                status
         FROM collector_state WHERE id = 1`,
      )
      .get() as
      | {
          lastDrawKey: string | null;
          lastDrawJson: string | null;
          lastSuccessAt: string | null;
          lastPollAt: string | null;
          failureCount: number;
          averageLatencyMs: number;
          duplicatesSkipped?: number;
          resumeState?: string;
          catchUpCount?: number;
          resumedFromDrawKey?: string | null;
          status: string;
        }
      | undefined;

    if (row === undefined) {
      return Promise.resolve(initialCollectorState());
    }

    let lastDraw: DrawResult | null = null;
    if (row.lastDrawJson !== null) {
      try {
        lastDraw = JSON.parse(row.lastDrawJson) as DrawResult;
      } catch {
        lastDraw = null;
      }
    }

    const status: CollectorStatus =
      row.status === 'running' || row.status === 'degraded' || row.status === 'stopped'
        ? row.status
        : 'stopped';

    return Promise.resolve({
      lastDrawKey: row.lastDrawKey ?? lastDraw?.drawKey ?? null,
      lastDraw,
      lastSuccessAt: row.lastSuccessAt,
      lastPollAt: row.lastPollAt,
      failureCount: row.failureCount,
      averageLatencyMs: row.averageLatencyMs,
      duplicatesSkipped: row.duplicatesSkipped ?? 0,
      resumeState: parseResumeState(row.resumeState),
      catchUpCount: row.catchUpCount ?? 0,
      resumedFromDrawKey: row.resumedFromDrawKey ?? null,
      status,
    });
  }

  async saveCollectorState(state: CollectorState): Promise<void> {
    await withSqliteRetry(() => {
      this.db
        .prepare(
          `UPDATE collector_state SET
            last_draw_key = @lastDrawKey,
            last_draw_json = @lastDrawJson,
            last_success_at = @lastSuccessAt,
            last_poll_at = @lastPollAt,
            failure_count = @failureCount,
            average_latency_ms = @averageLatencyMs,
            duplicates_skipped = @duplicatesSkipped,
            resume_state = @resumeState,
            catch_up_count = @catchUpCount,
            resumed_from_draw_key = @resumedFromDrawKey,
            status = @status
           WHERE id = 1`,
        )
        .run({
          lastDrawKey: state.lastDrawKey,
          lastDrawJson: state.lastDraw !== null ? JSON.stringify(state.lastDraw) : null,
          lastSuccessAt: state.lastSuccessAt,
          lastPollAt: state.lastPollAt,
          failureCount: state.failureCount,
          averageLatencyMs: state.averageLatencyMs,
          duplicatesSkipped: state.duplicatesSkipped,
          resumeState: state.resumeState,
          catchUpCount: state.catchUpCount,
          resumedFromDrawKey: state.resumedFromDrawKey,
          status: state.status,
        });
    });
  }

  close(): Promise<void> {
    this.db.close();
    return Promise.resolve();
  }
}

export { isSqliteBusyError, isUniqueConstraintError };
