import { BUILTIN_GAME_PRESETS } from '@/features/game-designer/builtin-presets';
import type {
  GamePolicyDraft,
  GamePolicyPreset,
  RewardPolicyConfig,
} from '@/features/game-designer/game-policy-types';
import { normalizeContinuePolicy } from '@/features/continue/continue-policy-utils';
import { resolvePresetMarkets } from '@/features/game-data/markets/market-catalog';
import {
  DEFAULT_MARKET_ID,
  type MarketDefinition,
} from '@/features/game-data/markets/market-definition';
import { findMarketById } from '@/features/game-data/markets/market-resolver';
import type { PlannerFormValues } from '@/features/planner/plan-service';

function rewardPolicyToFormTax(
  policy: RewardPolicyConfig,
): Pick<PlannerFormValues, 'winTaxEnabled' | 'winTaxThreshold' | 'winTaxRatePercent'> {
  const tax = policy.type === 'tier-tax';
  return {
    winTaxEnabled: tax,
    winTaxThreshold: tax ? (policy.threshold ?? '10.000.000') : '',
    winTaxRatePercent: tax ? (policy.ratePercent ?? '10') : '10',
  };
}

export function mergePresets(custom: readonly GamePolicyPreset[]): GamePolicyPreset[] {
  const overridden = new Set(custom.map((c) => c.id));
  const builtins = BUILTIN_GAME_PRESETS.filter((b) => !overridden.has(b.id));
  return [...builtins, ...custom].map((preset) => ({
    ...preset,
    continuePolicy: normalizeContinuePolicy(preset.continuePolicy),
  }));
}

export function findPreset(
  presets: readonly GamePolicyPreset[],
  id: string,
): GamePolicyPreset | undefined {
  return presets.find((p) => p.id === id);
}

export function marketToPlannerPatch(
  preset: GamePolicyPreset,
  marketId: string,
): Partial<PlannerFormValues> {
  const markets = resolvePresetMarkets(preset);
  const market =
    findMarketById(markets, marketId) ?? findMarketById(markets, DEFAULT_MARKET_ID) ?? markets[0];
  if (market === undefined) {
    return { marketId: DEFAULT_MARKET_ID };
  }
  return {
    marketId: market.id,
    rewardMultiplier: String(market.multiplier),
    ...rewardPolicyToFormTax(market.rewardPolicy),
  };
}

export function presetToPlannerPatch(preset: GamePolicyPreset): Partial<PlannerFormValues> {
  return {
    presetId: preset.id,
    minimumBet: preset.minimumBet,
    maximumBet: preset.maximumBet,
    betStep: preset.betStep,
    ...marketToPlannerPatch(preset, DEFAULT_MARKET_ID),
  };
}

export function applyPresetToForm(
  form: PlannerFormValues,
  preset: GamePolicyPreset,
): PlannerFormValues {
  return { ...form, ...presetToPlannerPatch(preset) };
}

export function applyMarketToForm(
  form: PlannerFormValues,
  preset: GamePolicyPreset,
  marketId: string,
): PlannerFormValues {
  return { ...form, ...marketToPlannerPatch(preset, marketId) };
}

export function draftFromPreset(preset: GamePolicyPreset): GamePolicyDraft {
  return {
    name: preset.name,
    category: preset.category,
    ...(preset.gameId !== undefined ? { gameId: preset.gameId } : {}),
    ...(preset.marketVersion !== undefined ? { marketVersion: preset.marketVersion } : {}),
    markets: [...resolvePresetMarkets(preset)],
    rewardMultiplier: preset.rewardMultiplier,
    minimumBet: preset.minimumBet,
    maximumBet: preset.maximumBet,
    betStep: preset.betStep,
    rewardPolicy: preset.rewardPolicy,
    continuePolicy: normalizeContinuePolicy(preset.continuePolicy),
  };
}

export function presetFromDraft(
  draft: GamePolicyDraft,
  id: string,
  options?: { builtin?: boolean },
): GamePolicyPreset {
  return {
    id,
    name: draft.name.trim() || 'My Preset',
    category: draft.category.trim() || 'Custom',
    ...(draft.gameId !== undefined ? { gameId: draft.gameId } : {}),
    ...(draft.marketVersion !== undefined ? { marketVersion: draft.marketVersion } : {}),
    ...(draft.markets !== undefined ? { markets: [...draft.markets] } : {}),
    rewardMultiplier: draft.rewardMultiplier,
    minimumBet: draft.minimumBet,
    maximumBet: draft.maximumBet,
    betStep: draft.betStep,
    rewardPolicy: draft.rewardPolicy,
    continuePolicy: normalizeContinuePolicy(draft.continuePolicy),
    createdAt: new Date().toISOString(),
    ...(options?.builtin === true ? { builtin: true } : {}),
  };
}

export function rewardPolicyLabel(policy: GamePolicyPreset['rewardPolicy']): string {
  if (policy.type === 'no-tax') {
    return 'No tax';
  }
  return `Tax ${policy.ratePercent ?? '?'}%`;
}

export function groupMarketsByType(markets: readonly MarketDefinition[]): {
  totals: MarketDefinition[];
  flowers: MarketDefinition[];
  sizes: MarketDefinition[];
} {
  const totals: MarketDefinition[] = [];
  const flowers: MarketDefinition[] = [];
  const sizes: MarketDefinition[] = [];
  for (const m of markets) {
    if (m.type === 'total') {
      totals.push(m);
    } else if (m.type === 'flower') {
      flowers.push(m);
    } else {
      sizes.push(m);
    }
  }
  return { totals, flowers, sizes };
}
