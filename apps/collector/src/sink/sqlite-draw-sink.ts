import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  initialCollectorState,
  type CollectorState,
  type CollectorStatus,
} from '../types/collector-state.js';
import type { DrawResult } from '../types/draw-result.js';
import { isSqliteBusyError, withSqliteRetry } from '../util/retry.js';
import type { DrawSink } from './draw-sink.js';

const packageDir = dirname(fileURLToPath(import.meta.url));

function drawToParams(draw: DrawResult): Record<string, unknown> {
  return {
    id: draw.id,
    gameId: draw.gameId,
    marketVersion: draw.marketVersion,
    drawNumber: draw.drawNumber,
    drawTime: draw.drawTime,
    publishedAt: draw.publishedAt,
    collectedAt: draw.collectedAt,
    latencyMs: draw.latencyMs,
    d1: draw.dice[0],
    d2: draw.dice[1],
    d3: draw.dice[2],
    total: draw.total,
    flower: draw.flower,
    smallLarge: draw.smallLarge,
    rawPayload: JSON.stringify(draw.rawPayload),
    source: draw.source,
  };
}

function rowToDraw(row: Record<string, unknown>): DrawResult {
  return {
    id: row['id'] as string,
    gameId: row['gameId'] as string,
    marketVersion: row['marketVersion'] as number,
    drawNumber: row['drawNumber'] as string,
    drawTime: row['drawTime'] as string,
    publishedAt: (row['publishedAt'] as string | null) ?? null,
    collectedAt: row['collectedAt'] as string,
    latencyMs: row['latencyMs'] as number,
    dice: [row['d1'] as number, row['d2'] as number, row['d3'] as number],
    total: row['total'] as number,
    flower: (row['flower'] as string | null) ?? null,
    smallLarge: row['smallLarge'] as DrawResult['smallLarge'],
    rawPayload: JSON.parse(row['rawPayload'] as string) as unknown,
    source: row['source'] as string,
  };
}

const SELECT_DRAW_COLUMNS = `
  id, game_id AS gameId, market_version AS marketVersion, draw_number AS drawNumber,
  draw_time AS drawTime, published_at AS publishedAt, collected_at AS collectedAt,
  latency_ms AS latencyMs, dice_1 AS d1, dice_2 AS d2, dice_3 AS d3,
  total, flower, small_large AS smallLarge, raw_payload AS rawPayload, source
`;

function isUniqueConstraintError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const code = (err as { code?: string }).code;
  return code === 'SQLITE_CONSTRAINT_UNIQUE' || code === 'SQLITE_CONSTRAINT';
}

export class SqliteDrawSink implements DrawSink {
  private readonly db: Database.Database;
  private readonly insertDraw: Database.Statement;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('busy_timeout = 5000');
    const schemaPath = join(packageDir, '..', '..', 'schema.sql');
    this.db.exec(readFileSync(schemaPath, 'utf8'));
    this.insertDraw = this.db.prepare(`
      INSERT INTO draw_results (
        id, game_id, market_version, draw_number, draw_time, published_at,
        collected_at, latency_ms, dice_1, dice_2, dice_3, total, flower,
        small_large, raw_payload, source
      ) VALUES (
        @id, @gameId, @marketVersion, @drawNumber, @drawTime, @publishedAt,
        @collectedAt, @latencyMs, @d1, @d2, @d3, @total, @flower,
        @smallLarge, @rawPayload, @source
      )
    `);
  }

  private runInsert(draw: DrawResult): boolean {
    try {
      this.insertDraw.run(drawToParams(draw));
      return true;
    } catch (err) {
      if (isUniqueConstraintError(err)) return false;
      throw err;
    }
  }

  async append(draw: DrawResult): Promise<void> {
    await withSqliteRetry(() => {
      this.runInsert(draw);
    });
  }

  async appendMany(draws: readonly DrawResult[]): Promise<void> {
    if (draws.length === 0) return;
    await withSqliteRetry(() => {
      const runBatch = this.db.transaction((items: readonly DrawResult[]) => {
        for (const draw of items) {
          this.runInsert(draw);
        }
      });
      runBatch(draws);
    });
  }

  async findLatest(): Promise<DrawResult | null> {
    const row = this.db
      .prepare(
        `SELECT ${SELECT_DRAW_COLUMNS} FROM draw_results ORDER BY draw_time DESC LIMIT 1`,
      )
      .get() as Record<string, unknown> | undefined;
    return row !== undefined ? rowToDraw(row) : null;
  }

  async findByDrawNumber(drawNumber: string): Promise<DrawResult | null> {
    const row = this.db
      .prepare(`SELECT ${SELECT_DRAW_COLUMNS} FROM draw_results WHERE draw_number = ?`)
      .get(drawNumber) as Record<string, unknown> | undefined;
    return row !== undefined ? rowToDraw(row) : null;
  }

  async count(): Promise<number> {
    const row = this.db.prepare(`SELECT COUNT(*) AS c FROM draw_results`).get() as {
      c: number;
    };
    return row.c;
  }

  async getLastDrawNumber(): Promise<string | null> {
    const latest = await this.findLatest();
    return latest?.drawNumber ?? null;
  }

  async loadCollectorState(): Promise<CollectorState> {
    const row = this.db
      .prepare(
        `SELECT last_draw_json AS lastDrawJson, last_success_at AS lastSuccessAt,
                last_poll_at AS lastPollAt, failure_count AS failureCount,
                average_latency_ms AS averageLatencyMs, status
         FROM collector_state WHERE id = 1`,
      )
      .get() as
      | {
          lastDrawJson: string | null;
          lastSuccessAt: string | null;
          lastPollAt: string | null;
          failureCount: number;
          averageLatencyMs: number;
          status: string;
        }
      | undefined;

    if (row === undefined) {
      return initialCollectorState();
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

    return {
      lastDraw,
      lastSuccessAt: row.lastSuccessAt,
      lastPollAt: row.lastPollAt,
      failureCount: row.failureCount,
      averageLatencyMs: row.averageLatencyMs,
      status,
    };
  }

  async saveCollectorState(state: CollectorState): Promise<void> {
    await withSqliteRetry(() => {
      this.db
        .prepare(
          `UPDATE collector_state SET
            last_draw_json = @lastDrawJson,
            last_success_at = @lastSuccessAt,
            last_poll_at = @lastPollAt,
            failure_count = @failureCount,
            average_latency_ms = @averageLatencyMs,
            status = @status
           WHERE id = 1`,
        )
        .run({
          lastDrawJson: state.lastDraw !== null ? JSON.stringify(state.lastDraw) : null,
          lastSuccessAt: state.lastSuccessAt,
          lastPollAt: state.lastPollAt,
          failureCount: state.failureCount,
          averageLatencyMs: state.averageLatencyMs,
          status: state.status,
        });
    });
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

export { isSqliteBusyError, isUniqueConstraintError };
