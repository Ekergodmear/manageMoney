/** @deprecated Dùng market-resolver + MarketDefinition */
export { DEFAULT_MARKET_ID } from '@/features/game-data/markets/market-definition';
export {
  findMarketForPlan,
  marketLabel,
  marketLabelFromPreset,
  resolvePresetMarkets,
} from '@/features/game-data/markets/market-catalog';
export { findMarketById, marketMatchesDraw } from '@/features/game-data/markets/market-resolver';
