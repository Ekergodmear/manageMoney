import { describe, expect, it } from 'vitest';

import { mergeBingo18DrawSources } from '../src/adapter/bingo18-adapter.js';
import {
  exclusiveEndDateForVnToday,
  isBeforeKqxsoCutover,
  isOnOrAfterKqxsoCutover,
  normalizeKqxsoDraw,
  resolveKqxsoDrawAt,
} from '../src/adapter/kqxso-bingo18-client.js';
import { drawKeyFromDrawAt } from '../src/types/draw-result.js';

describe('kqxso bingo18 client', () => {
  it('prefers metadata.originalTime for Vietnam wall clock', () => {
    const raw = {
      drawAt: '2026-07-09T05:41:00.000Z',
      winningResult: '535',
      metadata: { originalTime: '2026-07-09T12:41:00+07:00' },
    };
    expect(resolveKqxsoDrawAt(raw)).toBe('2026-07-09T12:41:00+07:00');
    expect(drawKeyFromDrawAt(normalizeKqxsoDraw(raw).drawAt)).toBe('20260709124100');
  });

  it('classifies cutover by calendar day in drawAt', () => {
    expect(isBeforeKqxsoCutover('2026-06-30T21:53:00+07:00')).toBe(true);
    expect(isOnOrAfterKqxsoCutover('2026-07-01T06:05:00+07:00')).toBe(true);
    expect(isBeforeKqxsoCutover('2026-07-01T06:05:00+07:00')).toBe(false);
  });

  it('uses tomorrow as exclusive end date for inclusive today', () => {
    const end = exclusiveEndDateForVnToday(new Date('2026-07-09T12:00:00+07:00'));
    expect(end).toBe('2026-07-10');
  });
});

describe('mergeBingo18DrawSources', () => {
  it('keeps legacy before 01/07 and prefers kqxso from cutover', () => {
    const merged = mergeBingo18DrawSources(
      [
        { drawAt: '2026-06-30T21:53:00+07:00', winningResult: '123' },
        { drawAt: '2026-07-01T09:11:00+07:00', winningResult: '999' },
      ],
      [{ drawAt: '2026-07-01T09:11:00+07:00', winningResult: '456' }],
      '2026-07-01',
    );

    expect(merged).toHaveLength(2);
    expect(merged[0]?.winningResult).toBe('123');
    expect(merged[1]?.winningResult).toBe('456');
  });
});
