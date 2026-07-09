import { describe, expect, it } from 'vitest';

import {
  BINGO18_FLOWER_MULTIPLIER,
  BINGO18_TOTAL_MULTIPLIERS,
  buildBingo18Markets,
} from '@/features/game-data/markets/bingo18-markets';
import { findMarketById } from '@/features/game-data/markets/market-resolver';

const markets = buildBingo18Markets({ type: 'no-tax' });

describe('Bingo18 payout table', () => {
  it('tổng 3,18 ×120 · 4,17 ×40 · 5,16 ×20 · 6,15 ×12 · 7,14 ×8 · 8,13 ×5.5 · 9,12 ×4.7 · 10,11 ×4.4', () => {
    expect(BINGO18_TOTAL_MULTIPLIERS).toEqual({
      3: 120,
      4: 40,
      5: 20,
      6: 12,
      7: 8,
      8: 5.5,
      9: 4.7,
      10: 4.4,
      11: 4.4,
      12: 4.7,
      13: 5.5,
      14: 8,
      15: 12,
      16: 20,
      17: 40,
      18: 120,
    });
  });

  it('tất cả hoa ×120', () => {
    expect(BINGO18_FLOWER_MULTIPLIER).toBe(120);
    for (const face of ['111', '222', '333', '444', '555', '666']) {
      const market = findMarketById(markets, `flower-${face}`);
      expect(market?.multiplier).toBe(120);
    }
  });

  it('market catalog phản ánh bảng thưởng', () => {
    for (let total = 3; total <= 18; total++) {
      const market = findMarketById(markets, `total-${String(total)}`);
      expect(market?.multiplier).toBe(BINGO18_TOTAL_MULTIPLIERS[total]);
    }
  });
});
