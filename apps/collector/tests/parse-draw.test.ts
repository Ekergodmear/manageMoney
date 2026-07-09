import { describe, expect, it } from 'vitest';

import { parseBingo18DrawBatch, parseDrawPayload } from '../src/parser/parse-draw.js';
import { drawKeyFromDrawAt } from '../src/types/draw-result.js';

describe('parseDrawPayload', () => {
  it('parses mock payload', () => {
    const result = parseDrawPayload(
      {
        kind: 'mock',
        drawKey: '100001',
        drawAt: '2026-06-25T10:00:00.000Z',
        publishedAt: '2026-06-25T10:00:05.000Z',
        dice: [4, 5, 6],
      },
      'mock',
      { rawResponse: { status: 200, headers: {}, body: '{}' } },
    );
    expect(result.success).toBe(true);
    expect(result.draw?.drawKey).toBe('100001');
    expect(result.draw?.dice).toEqual([4, 5, 6]);
    expect(result.draw?.total).toBe(15);
    expect(result.draw?.smallLarge).toBe('large');
    expect(result.draw?.flower).toBeNull();
    expect(result.draw?.publishedEstimated).toBe(false);
    expect(result.draw?.rawResponse?.status).toBe(200);
  });

  it('does not throw on invalid payload', () => {
    const result = parseDrawPayload(null, 'mock');
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('parses bingo18 winningResult into dice', () => {
    const result = parseDrawPayload(
      {
        kind: 'bingo18-list',
        draws: [{ drawAt: '2026-06-29T21:53:00+07:00', winningResult: '155' }],
        fetchedAt: '2026-06-29T15:00:00.000Z',
      },
      'bingo18',
    );
    expect(result.success).toBe(true);
    expect(result.draw?.dice).toEqual([1, 5, 5]);
    expect(result.draw?.total).toBe(11);
    expect(result.draw?.smallLarge).toBe('tie');
    expect(result.draw?.publishedAt).toBe('2026-06-29T21:53:00+07:00');
    expect(result.draw?.publishedEstimated).toBe(true);
    expect(result.draw?.drawKey).toBe(drawKeyFromDrawAt('2026-06-29T21:53:00+07:00'));
    expect(result.draw?.drawKey).toBe('20260629215300');
  });

  it('detects flower (triple)', () => {
    const result = parseDrawPayload(
      {
        kind: 'bingo18-list',
        draws: [{ drawAt: '2026-06-29T20:00:00+07:00', winningResult: '333' }],
        fetchedAt: '2026-06-29T15:00:00.000Z',
      },
      'bingo18',
    );
    expect(result.draw?.flower).toBe('333');
  });

  it('rejects invalid winningResult', () => {
    const batch = parseBingo18DrawBatch(
      {
        kind: 'bingo18-list',
        draws: [{ drawAt: '2026-06-29T20:00:00+07:00', winningResult: 'xyz' }],
        fetchedAt: '2026-06-29T15:00:00.000Z',
      },
      'bingo18',
    );
    expect(batch.draws).toHaveLength(0);
    expect(batch.errors.length).toBeGreaterThan(0);
  });
});

describe('drawKeyFromDrawAt', () => {
  it('formats wall-clock key without timezone chars', () => {
    expect(drawKeyFromDrawAt('2026-06-29T21:53:00+07:00')).toBe('20260629215300');
  });
});

describe('parseBingo18DrawBatch', () => {
  it('sorts draws chronologically', () => {
    const batch = parseBingo18DrawBatch(
      {
        kind: 'bingo18-list',
        draws: [
          { drawAt: '2026-06-29T22:00:00+07:00', winningResult: '123' },
          { drawAt: '2026-06-29T21:00:00+07:00', winningResult: '456' },
        ],
        fetchedAt: '2026-06-29T15:00:00.000Z',
      },
      'bingo18',
    );
    expect(batch.draws).toHaveLength(2);
    expect(batch.draws[0].drawAt).toBe('2026-06-29T21:00:00+07:00');
    expect(batch.draws[1].drawAt).toBe('2026-06-29T22:00:00+07:00');
  });
});
