import { describe, expect, it } from 'vitest';

import {
  dateKeyToReferenceInstant,
  filterDrawsByChartPeriod,
  formatChartPeriodHeading,
  getChartPeriodBounds,
  getDrawKeyBounds,
  resolveDrawInstant,
  toDrawKeyFromInstant,
  toGameDateKey,
} from '@/features/game-data/statistics/draw-period';
import { buildDistributions } from '@/features/game-data/statistics/snapshots';
import type { DrawRecord } from '@/features/game-data/statistics/statistics-types';

function draw(
  drawAt: string,
  total: number,
  flower: string | null = null,
  drawKey?: string,
): DrawRecord {
  return {
    drawKey: drawKey ?? drawAt.replace(/\D/g, '').slice(0, 14),
    drawAt,
    dice: [1, 2, 3],
    total,
    flower,
    smallLarge: total <= 9 ? 'small' : 'large',
  };
}

describe('draw-period (game TZ +07)', () => {
  it('getDrawKeyBounds — single day uses YYYYMMDD prefix', () => {
    const ref = dateKeyToReferenceInstant('2026-06-30');
    const bounds = getDrawKeyBounds('day', ref);
    expect(bounds.fromKey).toBe('20260630000000');
    expect(bounds.toKey.startsWith('20260630')).toBe(true);
  });

  it('filterDrawsByChartPeriod — day keeps only selected date', () => {
    const ref = dateKeyToReferenceInstant('2026-06-15');
    const draws = [
      draw('2026-06-15T08:00:00+07:00', 10, '111', '20260615080000'),
      draw('2026-06-14T20:00:00+07:00', 11, '222', '20260614200000'),
    ];
    const filtered = filterDrawsByChartPeriod(draws, 'day', ref);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.total).toBe(10);
  });

  it('filterDrawsByChartPeriod — 452 recent draws split by period', () => {
    const ref = dateKeyToReferenceInstant('2026-06-30');
    const draws: DrawRecord[] = [];
    for (const [day, count] of [
      [28, 148],
      [29, 159],
      [30, 145],
    ] as const) {
      for (let i = 0; i < count; i += 1) {
        const key = `202606${String(day).padStart(2, '0')}${String(12 + (i % 8)).padStart(2, '0')}0000`;
        draws.push(draw(`2026-06-${String(day).padStart(2, '0')}T12:00:00+07:00`, 10 + (i % 8), '333', key));
      }
    }
    expect(draws).toHaveLength(452);
    expect(filterDrawsByChartPeriod(draws, 'day', ref)).toHaveLength(145);
    expect(filterDrawsByChartPeriod(draws, 'week', ref)).toHaveLength(304);
    expect(filterDrawsByChartPeriod(draws, 'month', ref)).toHaveLength(452);
  });

  it('resolveDrawInstant — parses 14-digit drawKey', () => {
    const instant = resolveDrawInstant(draw('invalid', 10, null, '20260630123000'));
    expect(instant).not.toBeNull();
    expect(toGameDateKey(new Date(instant ?? 0))).toBe('2026-06-30');
  });

  it('formatChartPeriodHeading — day and quarter labels', () => {
    const ref = dateKeyToReferenceInstant('2026-06-30');
    expect(formatChartPeriodHeading('day', ref)).toBe('30/06/2026');
    expect(formatChartPeriodHeading('quarter', ref)).toBe('Quý 2/2026');
  });

  it('getChartPeriodBounds — past day uses full end-of-day, not noon cap', () => {
    const ref = dateKeyToReferenceInstant('2026-06-29');
    const clock = dateKeyToReferenceInstant('2026-06-30');
    clock.setHours(clock.getHours() + 9);
    const bounds = getChartPeriodBounds('day', ref, clock);
    expect(toGameDateKey(bounds.start)).toBe('2026-06-29');
    expect(toDrawKeyFromInstant(bounds.end).slice(0, 8)).toBe('20260629');
    expect(toDrawKeyFromInstant(bounds.end).slice(8)).toBe('235959');
  });

  it('filterDrawsByChartPeriod — day uses draw_key prefix', () => {
    const ref = dateKeyToReferenceInstant('2026-06-30');
    const draws = [
      draw('2026-06-30T08:00:00+07:00', 10, '111', '20260630080000'),
      draw('2026-06-29T20:00:00+07:00', 11, '222', '20260629200000'),
    ];
    expect(filterDrawsByChartPeriod(draws, 'day', ref)).toHaveLength(1);
    expect(filterDrawsByChartPeriod(draws, 'day', ref)[0]?.flower).toBe('111');
  });
});

describe('buildDistributions fillBuckets', () => {
  it('fills totals 3–18 and flowers 111–666 with zero counts', () => {
    const dist = buildDistributions([draw('2026-06-15T10:00:00+07:00', 10, '333')], {
      fillBuckets: true,
    });
    expect(dist.totals).toHaveLength(16);
    expect(dist.totals.find((b) => b.key === '10')?.count).toBe(1);
    expect(dist.flowers.find((b) => b.key === '333')?.label).toBe('Hoa 333');
  });
});
