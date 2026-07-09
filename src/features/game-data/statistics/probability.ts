import type { MarketDefinition } from '@/features/game-data/markets/market-definition';

export function expectedCount(probability: number, totalDraws: number): number {
  return probability * totalDraws;
}

export function actualHitRate(observedCount: number, totalDraws: number): number {
  if (totalDraws <= 0) {
    return 0;
  }
  return observedCount / totalDraws;
}

export function hitRateDelta(actual: number, expected: number): number {
  return actual - expected;
}

export function frequencyVariance(observedCount: number, expectedCount: number): number {
  return observedCount - expectedCount;
}

export function marketExpectedHitRate(market: MarketDefinition): number {
  return market.probability;
}
