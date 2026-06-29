import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import type { DrawSourceAdapter } from '../src/adapter/draw-source-adapter.js';
import { Collector } from '../src/collector.js';
import { SqliteDrawSink } from '../src/sink/sqlite-draw-sink.js';
import { AdaptivePollStrategy } from '../src/strategy/adaptive-poll-strategy.js';

function mockAdapter(
  payloads: Array<{ rawPayload: unknown } | null>,
): DrawSourceAdapter & { calls: number } {
  let idx = 0;
  const adapter = {
    id: 'mock-test',
    calls: 0,
    async fetchLatest() {
      adapter.calls += 1;
      const item = payloads[Math.min(idx, payloads.length - 1)];
      idx += 1;
      return item ?? null;
    },
  };
  return adapter;
}

describe('Collector', () => {
  let dir: string;
  let dbPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'collector-loop-'));
    dbPath = join(dir, 'test.db');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    rmSync(dir, { recursive: true, force: true });
  });

  it('deduplicates — does not save same draw twice', async () => {
    const payload = {
      kind: 'mock' as const,
      drawNumber: '200001',
      drawTime: '2026-06-25T10:00:00.000Z',
      publishedAt: '2026-06-25T10:00:00.000Z',
      dice: [2, 3, 4] as [number, number, number],
    };
    const sink = new SqliteDrawSink(dbPath);
    const adapter = mockAdapter([{ rawPayload: payload }, { rawPayload: payload }]);
    const collector = new Collector({
      sink,
      adapter,
      pollStrategy: new AdaptivePollStrategy(),
    });

    await collector.start();
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(60_000);
    await vi.runOnlyPendingTimersAsync();
    await collector.stop();

    expect(await sink.count()).toBe(1);
  });

  it('resumes state after restart', async () => {
    const payload = {
      kind: 'mock' as const,
      drawNumber: '300001',
      drawTime: '2026-06-25T11:00:00.000Z',
      publishedAt: '2026-06-25T11:00:00.000Z',
      dice: [1, 1, 1] as [number, number, number],
    };

    const adapter1 = mockAdapter([{ rawPayload: payload }]);
    const sink1 = new SqliteDrawSink(dbPath);
    const c1 = new Collector({ sink: sink1, adapter: adapter1, pollStrategy: new AdaptivePollStrategy() });
    await c1.start();
    await vi.runOnlyPendingTimersAsync();
    await c1.stop();

    const sink2 = new SqliteDrawSink(dbPath);
    const state = await sink2.loadCollectorState();
    expect(state.lastDraw?.drawNumber).toBe('300001');
    expect(await sink2.count()).toBe(1);
    await sink2.close();
  });

  it('backs off when adapter returns null', async () => {
    const sink = new SqliteDrawSink(dbPath);
    const adapter = mockAdapter([null, null]);
    const collector = new Collector({
      sink,
      adapter,
      adapterBackoffMs: 1_000,
      pollStrategy: new AdaptivePollStrategy(),
    });

    await collector.start();
    await vi.runOnlyPendingTimersAsync();
    const stateAfterFail = collector.getState();
    expect(stateAfterFail.failureCount).toBeGreaterThan(0);
    expect(stateAfterFail.status).toBe('degraded');
    await collector.stop();
  });

  it('continues after parse failure without crashing', async () => {
    const sink = new SqliteDrawSink(dbPath);
    const adapter = mockAdapter([{ rawPayload: { bad: true } }, { rawPayload: null }]);
    const collector = new Collector({ sink, adapter, pollStrategy: new AdaptivePollStrategy() });

    await collector.start();
    await vi.runOnlyPendingTimersAsync();
    await vi.runOnlyPendingTimersAsync();
    expect(collector.getState().status).toBe('degraded');
    await collector.stop();
    expect(await sink.count()).toBe(0);
  });
});
