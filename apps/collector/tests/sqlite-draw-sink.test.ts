import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { SqliteDrawSink } from '../src/sink/sqlite-draw-sink.js';
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
    rawResponse: { status: 200, headers: {}, body: '{}' },
  };
}

describe('SqliteDrawSink', () => {
  it('appendMany inserts in batch', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'collector-test-'));
    const dbPath = join(dir, 'test.db');
    const sink = new SqliteDrawSink(dbPath);
    await sink.appendMany([
      sampleDraw('1', '2026-01-01T09:00:00Z'),
      sampleDraw('2', '2026-01-01T10:00:00Z'),
    ]);
    expect(await sink.getLastDrawKey()).toBe('2');
    expect(await sink.count()).toBe(2);
    await sink.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('findLatest and findByDrawKey', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'collector-test-'));
    const dbPath = join(dir, 'test.db');
    const sink = new SqliteDrawSink(dbPath);
    const d1 = sampleDraw('10', '2026-01-01T10:00:00Z');
    const d2 = sampleDraw('20', '2026-01-01T11:00:00Z');
    await sink.appendMany([d1, d2]);
    const latest = await sink.findLatest();
    expect(latest?.drawKey).toBe('20');
    const byKey = await sink.findByDrawKey('10');
    expect(byKey?.drawKey).toBe('10');
    expect(byKey?.publishedEstimated).toBe(true);
    await sink.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('append ignores duplicate draw_key', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'collector-test-'));
    const dbPath = join(dir, 'test.db');
    const sink = new SqliteDrawSink(dbPath);
    const first = await sink.append(sampleDraw('dup', '2026-01-01T12:00:00Z'));
    const second = await sink.append({
      ...sampleDraw('dup', '2026-01-01T12:00:00Z'),
      dice: [4, 4, 4],
    });
    expect(first).toEqual({ inserted: 1, skipped: 0 });
    expect(second).toEqual({ inserted: 0, skipped: 1 });
    expect(await sink.count()).toBe(1);
    await sink.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('persists duplicates_skipped in collector state', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'collector-test-'));
    const dbPath = join(dir, 'test.db');
    const sink = new SqliteDrawSink(dbPath);
    const state = {
      ...initialCollectorState(),
      duplicatesSkipped: 42,
      status: 'running' as const,
    };
    await sink.saveCollectorState(state);
    const loaded = await sink.loadCollectorState();
    expect(loaded.duplicatesSkipped).toBe(42);
    await sink.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('findRecent and findLatest use draw_key not draw_at', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'collector-test-'));
    const dbPath = join(dir, 'test.db');
    const sink = new SqliteDrawSink(dbPath);
    const with555: DrawResult = {
      ...sampleDraw('20260628132300', '2026-06-28T06:23:00.000Z'),
      flower: '555',
      dice: [5, 5, 5],
      total: 15,
    };
    const mockLaterAt = sampleDraw('100501', '2026-07-01T12:00:00.000Z');
    const latest = sampleDraw('20260701091100', '2026-07-01T02:11:00.000Z');
    await sink.appendMany([with555, mockLaterAt, latest]);

    expect((await sink.findLatest())?.drawKey).toBe('20260701091100');

    const recent = await sink.findRecent(10);
    expect(recent.map((d) => d.drawKey)).toEqual([
      '100501',
      '20260628132300',
      '20260701091100',
    ]);

    let drought555 = 0;
    for (let i = recent.length - 1; i >= 0; i--) {
      const draw = recent[i];
      if (draw?.flower === '555') {
        drought555 = recent.length - 1 - i;
        break;
      }
    }
    expect(drought555).toBe(1);

    await sink.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('persists and loads collector state with lastDrawKey', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'collector-test-'));
    const dbPath = join(dir, 'test.db');
    const sink = new SqliteDrawSink(dbPath);
    const draw = sampleDraw('99', '2026-01-01T13:00:00Z');
    const state = {
      ...initialCollectorState(),
      lastDrawKey: '99',
      lastDraw: draw,
      lastSuccessAt: draw.collectedAt,
      failureCount: 2,
      averageLatencyMs: 120,
      status: 'running' as const,
    };
    await sink.saveCollectorState(state);
    const loaded = await sink.loadCollectorState();
    expect(loaded.lastDrawKey).toBe('99');
    expect(loaded.lastDraw?.drawKey).toBe('99');
    expect(loaded.failureCount).toBe(2);
    await sink.close();
    rmSync(dir, { recursive: true, force: true });
  });
});
