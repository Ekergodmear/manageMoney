import { describe, expect, it } from 'vitest';

import { computeMarketEconomics } from '@/features/game-data/markets/market-metrics';

describe('market-metrics', () => {
  it('computes EV and house edge for Tổng 4 (×40, P=3/216)', () => {
    const probability = 3 / 216;
    const { expectedReturn, houseEdge } = computeMarketEconomics(40, probability);
    expect(expectedReturn).toBeCloseTo(40 * probability, 4);
    expect(houseEdge).toBeCloseTo(1 - 40 * probability, 4);
  });

  it('computes EV for Hoa 666 (×180, P=1/216)', () => {
    const { expectedReturn, houseEdge } = computeMarketEconomics(180, 1 / 216);
    expect(expectedReturn).toBeCloseTo(180 / 216, 4);
    expect(houseEdge).toBeCloseTo(1 - 180 / 216, 4);
  });
});
