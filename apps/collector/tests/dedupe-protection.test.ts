import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import type { DrawSourceAdapter, RawDrawFetch } from '../src/adapter/draw-source-adapter.js';
import { Collector } from '../src/collector.js';
import { prepareDrawsForIngest } from '../src/dedupe/ingest-dedupe.js';
import {
  assessHealth,
  buildCollectorHealth,
  formatHealthReport,
} from '../src/health/collector-health.js';
import { SqliteDrawSink } from '../src/sink/sqlite-draw-sink.js';
import { AdaptivePollStrategy } from '../src/strategy/adaptive-poll-strategy.js';
import type { DrawResult } from '../src/types/draw-result.js';
import { initialCollectorState } from '../src/types/collector-state.js';

function sampleDraw(key: string, drawAt: string): DrawResult {
  return {
    drawKey: key,
    gameId: 'bingo18',
    marketVersion: 1,
    drawAt,
    publishedAt: drawAt,
    publishedEstimated: true,
    collectedAt: drawAt,
    latencyMs: 100,
    dice: [1, 2, 3],
    total: 6,
    flower: null,
    smallLarge: 'small',
    source: 'test',
    rawPayload: { key },
    rawResponse: null,
  };
}

function mockAdapter(payloads: RawDrawFetch[]): DrawSourceAdapter & { calls: number } {
  let idx = 0;
  const adapter = {
    id: 'mock-test',
    calls: 0,
    fetchLatest(): Promise<RawDrawFetch | null> {
      adapter.calls += 1;
      const item = payloads[Math.min(idx, payloads.length - 1)];
      idx += 1;
      return Promise.resolve(item ?? null);
    },
  };
  return adapter;
}

function mockFetch(drawKey: string, drawAt: string): RawDrawFetch {
  const rawPayload = {
    kind: 'mock' as const,
    drawKey,
    drawAt,
    publishedAt: drawAt,
    dice: [2, 3, 4] as [number, number, number],
  };
  return {
    rawPayload,
    rawResponse: { status: 200, headers: {}, body: JSON.stringify(rawPayload) },
  };
}

describe('prepareDrawsForIngest', () => {
  it('drops duplicates within batch and known keys', () => {
    const draws = [
      sampleDraw('a', '2026-01-01T10:00:00Z'),
      sampleDraw('a', '2026-01-01T10:05:00Z'),
      sampleDraw('b', '2026-01-01T11:00:00Z'),
    ];
    const known = new Set(['b']);
    const result = prepareDrawsForIngest(draws, known);
    expect(result.draws).toHaveLength(1);
    expect(result.draws[0].drawKey).toBe('a');
    expect(result.skippedDuplicates).toBe(2);
  });

  it('sorts out-of-order batch chronologically', () => {
    const draws = [
      sampleDraw('late', '2026-01-01T12:00:00Z'),
      sampleDraw('early', '2026-01-01T10:00:00Z'),
    ];
    const result = prepareDrawsForIngest(draws, new Set());
    expect(result.draws.map((d) => d.drawKey)).toEqual(['early', 'late']);
  });
});

describe('R1.2 duplicate protection', () => {
  let dir: string;
  let dbPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'collector-dedupe-'));
    dbPath = join(dir, 'test.db');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    rmSync(dir, { recursive: true, force: true });
  });

  it('restart does not duplicate draws', async () => {
    const fetch = mockFetch('400001', '2026-06-25T12:00:00.000Z');

    const sink1 = new SqliteDrawSink(dbPath);
    const c1 = new Collector({
      sink: sink1,
      adapter: mockAdapter([fetch]),
      pollStrategy: new AdaptivePollStrategy(),
    });
    await c1.start();
    await vi.runOnlyPendingTimersAsync();
    await c1.stop();
    await sink1.close();

    const sink2 = new SqliteDrawSink(dbPath);
    const c2 = new Collector({
      sink: sink2,
      adapter: mockAdapter([fetch]),
      pollStrategy: new AdaptivePollStrategy(),
    });
    await c2.start();
    await vi.runOnlyPendingTimersAsync();
    expect(await sink2.count()).toBe(1);
    expect(c2.getState().duplicatesSkipped).toBeGreaterThan(0);
    await c2.stop();
    await sink2.close();
  });

  it('retry of same payload does not duplicate', async () => {
    const fetch = mockFetch('500001', '2026-06-25T13:00:00.000Z');
    const sink = new SqliteDrawSink(dbPath);
    const collector = new Collector({
      sink,
      adapter: mockAdapter([fetch, fetch, fetch]),
      pollStrategy: new AdaptivePollStrategy(),
    });

    await collector.start();
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(120_000);
    await vi.runOnlyPendingTimersAsync();

    expect(await sink.count()).toBe(1);
    expect(collector.getState().duplicatesSkipped).toBeGreaterThanOrEqual(2);
    await collector.stop();
    await sink.close();
  });

  it('sink appendMany reports skipped duplicates', async () => {
    const sink = new SqliteDrawSink(dbPath);
    const draw = sampleDraw('dup-key', '2026-01-01T10:00:00Z');
    const first = await sink.append(draw);
    expect(first).toEqual({ inserted: 1, skipped: 0 });

    const second = await sink.append({ ...draw, dice: [6, 6, 6] });
    expect(second).toEqual({ inserted: 0, skipped: 1 });
    expect(await sink.count()).toBe(1);

    const batch = await sink.appendMany([draw, sampleDraw('new-key', '2026-01-01T11:00:00Z')]);
    expect(batch).toEqual({ inserted: 1, skipped: 1 });
    await sink.close();
  });

  it('doctor report shows duplicates skipped', () => {
    const state = {
      ...initialCollectorState(),
      duplicatesSkipped: 7,
      lastSuccessAt: new Date().toISOString(),
      lastDrawKey: '20260101100000',
    };
    const health = buildCollectorHealth(state, 'mock', 3, null);
    const report = assessHealth(health);
    const text = formatHealthReport(report);
    expect(text).toContain('Duplicates Skipped: 7');
  });
});
