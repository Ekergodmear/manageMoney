import type { MarketDefinition } from '@/features/game-data/markets/market-definition';

/** EV per unit bet = multiplier × probability. House edge = 1 − EV (player perspective). */
export function computeMarketEconomics(
  multiplier: number,
  probability: number,
): {
  readonly expectedReturn: number;
  readonly houseEdge: number;
} {
  const expectedReturn = multiplier * probability;
  const houseEdge = Math.max(0, 1 - expectedReturn);
  return { expectedReturn, houseEdge };
}

export function withMarketEconomics(
  market: Omit<MarketDefinition, 'expectedReturn' | 'houseEdge'>,
): MarketDefinition {
  const { expectedReturn, houseEdge } = computeMarketEconomics(
    market.multiplier,
    market.probability,
  );
  return { ...market, expectedReturn, houseEdge };
}

export function formatExpectedReturn(value: number): string {
  return `${(value * 100).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function formatHouseEdge(value: number): string {
  return `${(value * 100).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}
