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

export class SqliteDrawSink implements DrawSink {
  private readonly db: Database.Database;
  private readonly insertDraw: Database.Statement;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
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

  async append(draw: DrawResult): Promise<void> {
    this.insertDraw.run(drawToParams(draw));
  }

  async appendMany(draws: readonly DrawResult[]): Promise<void> {
    if (draws.length === 0) return;
    const runBatch = this.db.transaction((items: readonly DrawResult[]) => {
      for (const draw of items) {
        this.insertDraw.run(drawToParams(draw));
      }
    });
    runBatch(draws);
  }

  async getLastDrawNumber(): Promise<string | null> {
    const row = this.db
      .prepare(
        `SELECT draw_number AS drawNumber FROM draw_results ORDER BY collected_at DESC LIMIT 1`,
      )
      .get() as { drawNumber: string } | undefined;
    return row?.drawNumber ?? null;
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
  }

  async close(): Promise<void> {
    this.db.close();
  }
}
