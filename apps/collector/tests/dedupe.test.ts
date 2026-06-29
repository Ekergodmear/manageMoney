import { describe, expect, it } from 'vitest';

import type { DrawResult } from '../src/types/draw-result.js';
import { dedupeDrawsByNumber, filterNewDraws } from '../src/util/dedupe.js';

function draw(n: string, time: string): DrawResult {
  return {
    id: `id-${n}`,
    gameId: 'bingo18',
    marketVersion: 1,
    drawNumber: n,
    drawTime: time,
    publishedAt: null,
    collectedAt: time,
    latencyMs: 0,
    dice: [1, 2, 3],
    total: 6,
    flower: null,
    smallLarge: 'small',
    rawPayload: {},
    source: 'test',
  };
}

describe('dedupe', () => {
  it('filterNewDraws excludes known numbers', () => {
    const draws = [draw('a', 't1'), draw('b', 't2')];
    const known = new Set(['a']);
    expect(filterNewDraws(draws, known)).toHaveLength(1);
    expect(filterNewDraws(draws, known)[0].drawNumber).toBe('b');
  });

  it('dedupeDrawsByNumber keeps last per drawNumber', () => {
    const draws = [
      draw('same', '2026-01-01T10:00:00Z'),
      draw('same', '2026-01-01T11:00:00Z'),
      draw('other', '2026-01-01T12:00:00Z'),
    ];
    const result = dedupeDrawsByNumber(draws);
    expect(result).toHaveLength(2);
    expect(result.find((d) => d.drawNumber === 'same')?.drawTime).toBe('2026-01-01T11:00:00Z');
  });
});
