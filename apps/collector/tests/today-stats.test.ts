import { describe, expect, it } from 'vitest';

import { buildTodayStats } from '../src/http/today-stats.js';

describe('today-stats', () => {
  it('buildTodayStats fills totals 3-18 and flowers with metadata', () => {
    const stats = buildTodayStats(
      [
        { total: 11, flower: null },
        { total: 11, flower: '444' },
        { total: 6, flower: null },
      ],
      '2026-06-30',
      '2026-06-30T12:00:00.000Z',
    );
    expect(stats.drawCount).toBe(3);
    expect(stats.timezone).toBe('Asia/Ho_Chi_Minh');
    expect(stats.generatedAt).toBe('2026-06-30T12:00:00.000Z');
    expect(stats.totals.find((t) => t.value === 11)?.count).toBe(2);
    expect(stats.totals.find((t) => t.value === 3)?.count).toBe(0);
    expect(stats.flowers.find((f) => f.value === '444')?.count).toBe(1);
    expect(stats.flowers.find((f) => f.value === '111')?.count).toBe(0);
  });
});
