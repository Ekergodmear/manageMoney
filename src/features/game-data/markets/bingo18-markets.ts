import type { RewardPolicyConfig } from '@/features/game-designer/game-policy-types';
import type { MarketDefinition } from '@/features/game-data/markets/market-definition';
import { withMarketEconomics } from '@/features/game-data/markets/market-metrics';

import { DICE_OUTCOMES, probabilityFromWays, sizeWays, TOTAL_WAYS } from './bingo18-probability';

/** Hệ số thưởng Bingo18 chuẩn (đối xứng theo tổng). */
export const BINGO18_TOTAL_MULTIPLIERS: Readonly<Record<number, number>> = {
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
};

export const BINGO18_FLOWER_MULTIPLIER = 120;

const TOTAL_MULTIPLIERS = BINGO18_TOTAL_MULTIPLIERS;
const FLOWER_FACE = BINGO18_FLOWER_MULTIPLIER;
const SIZE_MULTIPLIERS = { small: 2, tie: 5, large: 2 } as const;
const SIZE_LABELS = { small: 'Xỉu', tie: 'Hòa', large: 'Tài' } as const;

function totalMarket(total: number, rewardPolicy: RewardPolicyConfig): MarketDefinition {
  const ways = TOTAL_WAYS[total] ?? 0;
  return withMarketEconomics({
    id: `total-${String(total)}`,
    type: 'total',
    label: `Tổng ${String(total)}`,
    multiplier: TOTAL_MULTIPLIERS[total] ?? 6,
    probability: probabilityFromWays(ways),
    rewardPolicy,
    matchValue: total,
  });
}

function flowerMarket(face: string, rewardPolicy: RewardPolicyConfig): MarketDefinition {
  return withMarketEconomics({
    id: `flower-${face}`,
    type: 'flower',
    label: `Hoa ${face}`,
    multiplier: FLOWER_FACE,
    probability: 1 / DICE_OUTCOMES,
    rewardPolicy,
    matchValue: face,
  });
}

function sizeMarket(
  kind: 'small' | 'tie' | 'large',
  rewardPolicy: RewardPolicyConfig,
): MarketDefinition {
  return withMarketEconomics({
    id: `size-${kind}`,
    type: 'size',
    label: SIZE_LABELS[kind],
    multiplier: SIZE_MULTIPLIERS[kind],
    probability: probabilityFromWays(sizeWays(kind)),
    rewardPolicy,
    matchValue: kind,
  });
}

/** Bingo18 đầy đủ — Game Designer sinh từ đây cho preset bingo-120. */
export function buildBingo18Markets(rewardPolicy: RewardPolicyConfig): readonly MarketDefinition[] {
  const totals: MarketDefinition[] = [];
  for (let t = 3; t <= 18; t++) {
    totals.push(totalMarket(t, rewardPolicy));
  }
  const flowers = ['111', '222', '333', '444', '555', '666'].map((f) =>
    flowerMarket(f, rewardPolicy),
  );
  const sizes: MarketDefinition[] = [
    sizeMarket('small', rewardPolicy),
    sizeMarket('tie', rewardPolicy),
    sizeMarket('large', rewardPolicy),
  ];
  return [...totals, ...flowers, ...sizes];
}
