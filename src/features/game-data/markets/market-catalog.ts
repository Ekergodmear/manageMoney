import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { buildBingo18Markets } from '@/features/game-data/markets/bingo18-markets';
import {
  DEFAULT_MARKET_ID,
  type MarketDefinition,
} from '@/features/game-data/markets/market-definition';
import { withMarketEconomics } from '@/features/game-data/markets/market-metrics';
import { findMarketById } from '@/features/game-data/markets/market-resolver';

export { DEFAULT_MARKET_ID };

export function resolvePresetMarkets(preset: GamePolicyPreset): readonly MarketDefinition[] {
  if (preset.markets !== undefined && preset.markets.length > 0) {
    return preset.markets;
  }
  if (preset.gameId === 'bingo18' || preset.id.startsWith('bingo')) {
    return buildBingo18Markets(preset.rewardPolicy);
  }
  const multiplier = Number(preset.rewardMultiplier.replace(/,/g, '').trim()) || 1;
  const probability = 1;
  return [
    withMarketEconomics({
      id: DEFAULT_MARKET_ID,
      type: 'total',
      label: preset.name,
      multiplier,
      probability,
      rewardPolicy: preset.rewardPolicy,
      matchValue: 4,
    }),
  ];
}

export function marketLabel(marketId: string, markets: readonly MarketDefinition[]): string {
  return findMarketById(markets, marketId)?.label ?? marketId;
}

export function marketLabelFromPreset(preset: GamePolicyPreset, marketId: string): string {
  return marketLabel(marketId, resolvePresetMarkets(preset));
}

export function formatMultiplierDisplay(multiplier: number): string {
  return Number.isInteger(multiplier) ? String(multiplier) : multiplier.toFixed(1);
}

/** Nhãn plan kèm hệ số — vd. `Tổng 10 · ×4.4`. */
export function marketPlanLabelFromPreset(
  preset: GamePolicyPreset,
  marketId: string,
): string {
  const market = findMarketForPlan(preset, marketId);
  if (market === undefined) {
    return marketId;
  }
  return `${market.label} · ×${formatMultiplierDisplay(market.multiplier)}`;
}

export function findMarketForPlan(
  preset: GamePolicyPreset | undefined,
  marketId: string,
): MarketDefinition | undefined {
  if (preset === undefined) {
    return undefined;
  }
  return findMarketById(resolvePresetMarkets(preset), marketId);
}
