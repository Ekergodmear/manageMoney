import { describe, expect, it } from 'vitest';

import type { DrawResult } from '../src/types/draw-result.js';
import { dedupeDrawsByKey, filterNewDraws } from '../src/util/dedupe.js';

function draw(key: string, at: string): DrawResult {
  return {
    drawKey: key,
    gameId: 'bingo18',
    marketVersion: 1,
    drawAt: at,
    publishedAt: at,
    publishedEstimated: true,
    collectedAt: at,
    latencyMs: 0,
    dice: [1, 2, 3],
    total: 6,
    flower: null,
    smallLarge: 'small',
    source: 'test',
    rawPayload: {},
    rawResponse: null,
  };
}

describe('dedupe', () => {
  it('filterNewDraws excludes known keys', () => {
    const draws = [draw('a', 't1'), draw('b', 't2')];
    const known = new Set(['a']);
    expect(filterNewDraws(draws, known)).toHaveLength(1);
    expect(filterNewDraws(draws, known)[0].drawKey).toBe('b');
  });

  it('dedupeDrawsByKey keeps last per drawKey', () => {
    const draws = [
      draw('same', '2026-01-01T10:00:00Z'),
      draw('same', '2026-01-01T11:00:00Z'),
      draw('other', '2026-01-01T12:00:00Z'),
    ];
    const result = dedupeDrawsByKey(draws);
    expect(result).toHaveLength(2);
    expect(result.find((d) => d.drawKey === 'same')?.drawAt).toBe('2026-01-01T11:00:00Z');
  });
});
