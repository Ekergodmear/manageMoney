import type { PlayedRoundDrawSnapshot } from '@/features/game-data/entities/played-round';
import type { MarketDefinition } from '@/features/game-data/markets/market-definition';

export function marketMatchesDraw(
  market: MarketDefinition,
  draw: PlayedRoundDrawSnapshot,
): boolean {
  switch (market.type) {
    case 'total':
      return typeof market.matchValue === 'number' && draw.total === market.matchValue;
    case 'flower':
      return draw.flower === market.matchValue;
    case 'size':
      return (
        (market.matchValue === 'small' ||
          market.matchValue === 'tie' ||
          market.matchValue === 'large') &&
        draw.smallLarge === market.matchValue
      );
    default:
      return false;
  }
}

export function findMarketById(
  markets: readonly MarketDefinition[],
  marketId: string,
): MarketDefinition | undefined {
  return markets.find((m) => m.id === marketId);
}
