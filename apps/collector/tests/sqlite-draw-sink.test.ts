import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { SqliteDrawSink } from '../src/sink/sqlite-draw-sink.js';
import type { DrawResult } from '../src/types/draw-result.js';
import { initialCollectorState } from '../src/types/collector-state.js';

function sampleDraw(n: string): DrawResult {
  const t = new Date().toISOString();
  return {
    id: `id-${n}`,
    gameId: 'bingo18',
    marketVersion: 1,
    drawNumber: n,
    drawTime: t,
    publishedAt: t,
    collectedAt: t,
    latencyMs: 100,
    dice: [1, 2, 3],
    total: 6,
    flower: null,
    smallLarge: 'small',
    rawPayload: { n },
    source: 'test',
  };
}

describe('SqliteDrawSink', () => {
  it('appendMany inserts in batch', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'collector-test-'));
    const dbPath = join(dir, 'test.db');
    const sink = new SqliteDrawSink(dbPath);
    await sink.appendMany([sampleDraw('1'), sampleDraw('2')]);
    expect(await sink.getLastDrawNumber()).toBe('2');
    await sink.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('persists and loads collector state', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'collector-test-'));
    const dbPath = join(dir, 'test.db');
    const sink = new SqliteDrawSink(dbPath);
    const draw = sampleDraw('99');
    const state = {
      ...initialCollectorState(),
      lastDraw: draw,
      lastSuccessAt: draw.collectedAt,
      failureCount: 2,
      averageLatencyMs: 120,
      status: 'running' as const,
    };
    await sink.saveCollectorState(state);
    const loaded = await sink.loadCollectorState();
    expect(loaded.lastDraw?.drawNumber).toBe('99');
    expect(loaded.failureCount).toBe(2);
    expect(loaded.averageLatencyMs).toBe(120);
    await sink.close();
    rmSync(dir, { recursive: true, force: true });
  });
});
