import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import type { DrawSourceAdapter, RawDrawFetch } from '../src/adapter/draw-source-adapter.js';
import { Collector } from '../src/collector.js';
import {
  assessHealth,
  buildCollectorHealth,
  formatHealthReport,
} from '../src/health/collector-health.js';
import { SqliteDrawSink } from '../src/sink/sqlite-draw-sink.js';
import { AdaptivePollStrategy } from '../src/strategy/adaptive-poll-strategy.js';
import { resetRetryObservabilityForTests } from '../src/retry/retry-state.js';
import { initialCollectorState } from '../src/types/collector-state.js';

function bingo18Batch(
  draws: readonly { drawAt: string; winningResult: string }[],
): RawDrawFetch {
  return {
    rawPayload: {
      kind: 'bingo18-list' as const,
      draws: [...draws],
      fetchedAt: '2026-06-29T15:00:00.000Z',
    },
    rawResponse: { status: 200, headers: {}, body: '{}' },
  };
}

function mockAdapter(payloads: readonly (RawDrawFetch | null)[]): DrawSourceAdapter {
  let idx = 0;
  return {
    id: 'mock-test',
    fetchLatest(): Promise<RawDrawFetch | null> {
      const item = payloads[Math.min(idx, payloads.length - 1)];
      idx += 1;
      return Promise.resolve(item ?? null);
    },
  };
}

describe('R1.3 resume & catch-up', () => {
  let dir: string;
  let dbPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'collector-resume-'));
    dbPath = join(dir, 'test.db');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    rmSync(dir, { recursive: true, force: true });
  });

  it('case 1: stop → 2 new draws → start catches up both', async () => {
    const initialBatch = bingo18Batch([
      { drawAt: '2026-06-29T20:00:00+07:00', winningResult: '123' },
    ]);
    const expandedBatch = bingo18Batch([
      { drawAt: '2026-06-29T20:00:00+07:00', winningResult: '123' },
      { drawAt: '2026-06-29T21:00:00+07:00', winningResult: '456' },
      { drawAt: '2026-06-29T22:00:00+07:00', winningResult: '155' },
    ]);

    const sink1 = new SqliteDrawSink(dbPath);
    const c1 = new Collector({
      sink: sink1,
      adapter: mockAdapter([initialBatch]),
      pollStrategy: new AdaptivePollStrategy(),
    });
    await c1.start();
    await vi.runOnlyPendingTimersAsync();
    await c1.stop();
    await sink1.close();

    const sink2 = new SqliteDrawSink(dbPath);
    const c2 = new Collector({
      sink: sink2,
      adapter: mockAdapter([expandedBatch]),
      pollStrategy: new AdaptivePollStrategy(),
    });
    await c2.start();
    await vi.runOnlyPendingTimersAsync();

    expect(await sink2.count()).toBe(3);
    expect(c2.getState().resumeState).toBe('catch-up');
    expect(c2.getState().catchUpCount).toBe(2);
    await c2.stop();
    await sink2.close();
  });

  it('case 2: immediate restart does not duplicate', async () => {
    const batch = bingo18Batch([
      { drawAt: '2026-06-29T20:00:00+07:00', winningResult: '123' },
    ]);

    const sink1 = new SqliteDrawSink(dbPath);
    const c1 = new Collector({
      sink: sink1,
      adapter: mockAdapter([batch]),
      pollStrategy: new AdaptivePollStrategy(),
    });
    await c1.start();
    await vi.runOnlyPendingTimersAsync();
    await c1.stop();
    await sink1.close();

    const sink2 = new SqliteDrawSink(dbPath);
    const c2 = new Collector({
      sink: sink2,
      adapter: mockAdapter([batch]),
      pollStrategy: new AdaptivePollStrategy(),
    });
    await c2.start();
    await vi.runOnlyPendingTimersAsync();

    expect(await sink2.count()).toBe(1);
    expect(c2.getState().resumeState).toBe('resumed');
    expect(c2.getState().catchUpCount).toBe(0);
    await c2.stop();
    await sink2.close();
  });

  it('case 3: restart → adapter timeout → retry → catch-up', async () => {
    const initialBatch = bingo18Batch([
      { drawAt: '2026-06-29T20:00:00+07:00', winningResult: '123' },
    ]);
    const expandedBatch = bingo18Batch([
      { drawAt: '2026-06-29T20:00:00+07:00', winningResult: '123' },
      { drawAt: '2026-06-29T21:00:00+07:00', winningResult: '456' },
      { drawAt: '2026-06-29T22:00:00+07:00', winningResult: '155' },
    ]);

    const sink1 = new SqliteDrawSink(dbPath);
    const c1 = new Collector({
      sink: sink1,
      adapter: mockAdapter([initialBatch]),
      pollStrategy: new AdaptivePollStrategy(),
    });
    await c1.start();
    await vi.runOnlyPendingTimersAsync();
    await c1.stop();
    await sink1.close();

    const sink2 = new SqliteDrawSink(dbPath);
    const c2 = new Collector({
      sink: sink2,
      adapter: mockAdapter([null, expandedBatch]),
      adapterBackoffMs: 1_000,
      pollStrategy: new AdaptivePollStrategy(),
    });
    await c2.start();
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(2_000);
    await vi.runOnlyPendingTimersAsync();

    expect(await sink2.count()).toBe(3);
    expect(c2.getState().resumeState).toBe('catch-up');
    expect(c2.getState().catchUpCount).toBe(2);
    await c2.stop();
    await sink2.close();
  });

  it('case 4: restart with no new draws does not append', async () => {
    const batch = bingo18Batch([
      { drawAt: '2026-06-29T20:00:00+07:00', winningResult: '123' },
      { drawAt: '2026-06-29T21:00:00+07:00', winningResult: '456' },
    ]);

    const sink1 = new SqliteDrawSink(dbPath);
    const c1 = new Collector({
      sink: sink1,
      adapter: mockAdapter([batch]),
      pollStrategy: new AdaptivePollStrategy(),
    });
    await c1.start();
    await vi.runOnlyPendingTimersAsync();
    await c1.stop();
    await sink1.close();

    const sink2 = new SqliteDrawSink(dbPath);
    const c2 = new Collector({
      sink: sink2,
      adapter: mockAdapter([batch]),
      pollStrategy: new AdaptivePollStrategy(),
    });
    await c2.start();
    await vi.runOnlyPendingTimersAsync();

    expect(await sink2.count()).toBe(2);
    expect(c2.getState().resumeState).toBe('resumed');
    expect(c2.getState().catchUpCount).toBe(0);
    await c2.stop();
    await sink2.close();
  });

  it('case 5: doctor shows resume state, latest draw, and catch-up count', () => {
    resetRetryObservabilityForTests();
    const state = {
      ...initialCollectorState(),
      lastDrawKey: '20260629220000',
      resumeState: 'catch-up' as const,
      catchUpCount: 2,
      resumedFromDrawKey: '20260629200000',
      lastSuccessAt: new Date().toISOString(),
      lastPollAt: new Date().toISOString(),
    };
    const health = buildCollectorHealth(state, 'mock-test', 3, null);
    const report = assessHealth(health);
    const text = formatHealthReport(report);

    expect(text).toContain('Resume State      Catch-up');
    expect(text).toContain('Resumed From');
    expect(text).toContain('Latest Draw       20260629220000');
    expect(text).toContain('Catch-up Count    2');
  });
});
