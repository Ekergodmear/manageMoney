import { describe, expect, it } from 'vitest';

import { buildBingo18Markets } from '@/features/game-data/markets/bingo18-markets';
import { findMarketById, marketMatchesDraw } from '@/features/game-data/markets/market-resolver';
import { settleRound } from '@/features/game-data/settlement/round-settlement-engine';

const draw = {
  drawKey: '20260629220000',
  gameId: 'bingo18',
  marketVersion: 1,
  drawAt: '2026-06-29T22:00:00+07:00',
  publishedAt: '2026-06-29T22:00:00+07:00',
  publishedEstimated: true,
  collectedAt: '2026-06-29T22:02:01+07:00',
  latencyMs: 121_000,
  dice: [1, 1, 2] as const,
  total: 4,
  flower: null,
  smallLarge: 'small' as const,
  source: 'bingo18',
};

const markets = buildBingo18Markets({ type: 'no-tax' });
const total4 = findMarketById(markets, 'total-4');
const flower666 = findMarketById(markets, 'flower-666');
const sizeLarge = findMarketById(markets, 'size-large');
if (total4 === undefined || flower666 === undefined || sizeLarge === undefined) {
  throw new Error('missing bingo18 test markets');
}

describe('marketMatchesDraw', () => {
  it('matches total-4 when dice sum is 4', () => {
    expect(marketMatchesDraw(total4, { ...draw, total: 4, dice: [1, 1, 2] })).toBe(true);
    expect(marketMatchesDraw(total4, { ...draw, total: 5 })).toBe(false);
  });

  it('matches flower-666 on triple six', () => {
    expect(
      marketMatchesDraw(flower666, {
        ...draw,
        dice: [6, 6, 6],
        total: 18,
        flower: '666',
      }),
    ).toBe(true);
  });

  it('matches size-large', () => {
    expect(marketMatchesDraw(sizeLarge, { ...draw, total: 15, smallLarge: 'large' })).toBe(true);
    expect(marketMatchesDraw(sizeLarge, { ...draw, total: 8, smallLarge: 'small' })).toBe(false);
  });
});

describe('settleRound', () => {
  it('wins total-4 on draw 1-1-2 with ×40', () => {
    const result = settleRound({
      draw,
      roundIndex: 47,
      bet: 100_000,
      accumulatedSpentBefore: 3_800_000,
      market: total4,
    });
    expect(result.marketMatched).toBe(true);
    expect(result.prize).toBe(4_000_000);
    expect(result.netPrize).toBe(4_000_000);
    expect(result.profit).toBe(100_000);
  });

  it('loses when total does not match', () => {
    const result = settleRound({
      draw: { ...draw, total: 11, dice: [3, 4, 4] },
      roundIndex: 1,
      bet: 10_000,
      accumulatedSpentBefore: 0,
      market: total4,
    });
    expect(result.marketMatched).toBe(false);
    expect(result.profit).toBe(-10_000);
  });

  it('applies tier tax from market reward policy', () => {
    const taxedMarkets = buildBingo18Markets({
      type: 'tier-tax',
      threshold: '10.000.000',
      ratePercent: '10',
    });
    const market = findMarketById(taxedMarkets, 'total-4');
    if (market === undefined) {
      throw new Error('missing total-4 market');
    }
    const result = settleRound({
      draw,
      roundIndex: 1,
      bet: 500_000,
      accumulatedSpentBefore: 0,
      market,
      winTax: { threshold: 10_000_000, ratePercent: 10 },
    });
    expect(result.prize).toBe(20_000_000);
    expect(result.tax).toBe(2_000_000);
    expect(result.netPrize).toBe(18_000_000);
  });
});
