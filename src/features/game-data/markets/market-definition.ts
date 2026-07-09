import type { RewardPolicyConfig } from '@/features/game-designer/game-policy-types';

export type MarketType = 'total' | 'flower' | 'size';

/** Match target — total 3–18, flower "111"–"666", size small|tie|large. */
export type MarketMatchValue = number | string;

export interface MarketDefinition {
  readonly id: string;
  readonly type: MarketType;
  readonly label: string;
  readonly multiplier: number;
  /** Xác suất lý thuyết (0–1), ví dụ 3/216. */
  readonly probability: number;
  readonly rewardPolicy: RewardPolicyConfig;
  readonly matchValue: MarketMatchValue;
  /** multiplier × probability */
  readonly expectedReturn: number;
  /** 1 − expectedReturn */
  readonly houseEdge: number;
}

export const DEFAULT_MARKET_ID = 'total-4';
