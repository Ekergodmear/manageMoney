import { describe, expect, it } from 'vitest';

import { buildBingo18Markets } from '@/features/game-data/markets/bingo18-markets';
import type { DrawRecord } from '@/features/game-data/statistics/statistics-types';
import { computeGameStatistics } from '@/features/game-data/statistics/statistics-engine';
import { computeMarketStreak, countMarketHits } from '@/features/game-data/statistics/streaks';
import { computeMarketEconomics } from '@/features/game-data/markets/market-metrics';

function makeDraw(overrides: Partial<DrawRecord> & Pick<DrawRecord, 'drawKey'>): DrawRecord {
  return {
    drawAt: '2026-06-25T10:00:00+07:00',
    dice: [1, 1, 2],
    total: 4,
    flower: null,
    smallLarge: 'small',
    ...overrides,
  };
}

describe('StatisticsEngine', () => {
  const markets = buildBingo18Markets({
    type: 'tier-tax',
    threshold: '10.000.000',
    ratePercent: '10',
  });
  const total4 = markets.find((m) => m.id === 'total-4');
  const flower666 = markets.find((m) => m.id === 'flower-666');

  it('counts market hits and drought', () => {
    const draws: DrawRecord[] = [
      makeDraw({ drawKey: 'a', total: 5 }),
      makeDraw({ drawKey: 'b', total: 4 }),
      makeDraw({ drawKey: 'c', total: 6 }),
      makeDraw({ drawKey: 'd', total: 5 }),
    ];
    expect(total4).toBeDefined();
    if (total4 === undefined) {
      return;
    }
    expect(countMarketHits(draws, total4)).toBe(1);
    const streak = computeMarketStreak(draws, total4);
    expect(streak.drought).toBe(2);
    expect(streak.lastSeenDrawsAgo).toBe(2);
  });

  it('builds snapshot with expected vs actual hit rates', () => {
    const draws: DrawRecord[] = Array.from({ length: 1000 }, (_, i) =>
      makeDraw({
        drawKey: `k-${String(i)}`,
        total: i % 50 === 0 ? 4 : 10,
        drawAt: `2026-06-25T${String(10 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00+07:00`,
      }),
    );
    const snapshot = computeGameStatistics(draws, markets);
    expect(snapshot.totalDraws).toBe(1000);
    expect(snapshot.rollingWindows).toHaveLength(3);
    expect(snapshot.distributions.totals.length).toBeGreaterThan(0);

    const t4 = snapshot.markets.find((m) => m.marketId === 'total-4');
    expect(t4).toBeDefined();
    if (t4 === undefined) {
      return;
    }
    expect(t4.observedCount).toBe(20);
    expect(t4.expectedCount).toBeCloseTo(1000 * t4.expectedHitRate, 0);
    expect(t4.variance).toBeCloseTo(t4.observedCount - t4.expectedCount, 0);
  });

  it('never-hit market has drought equal to draw count', () => {
    const draws: DrawRecord[] = Array.from({ length: 50 }, (_, i) =>
      makeDraw({ drawKey: `x-${String(i)}`, total: 10, flower: null }),
    );
    expect(flower666).toBeDefined();
    if (flower666 === undefined) {
      return;
    }
    const streak = computeMarketStreak(draws, flower666);
    expect(streak.drought).toBe(50);
    expect(streak.lastSeenAt).toBeNull();
  });
});

describe('market-metrics', () => {
  it('EV for total-4', () => {
    const multiplier = 40;
    const probability = 3 / 216;
    const { expectedReturn } = computeMarketEconomics(multiplier, probability);
    expect(expectedReturn).toBeCloseTo(multiplier * probability, 4);
  });
});
