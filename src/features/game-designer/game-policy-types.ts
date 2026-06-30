import type { MarketDefinition } from '@/features/game-data/markets/market-definition';

export type RewardPolicyType = 'no-tax' | 'tier-tax';

export interface RewardPolicyConfig {
  readonly type: RewardPolicyType;
  readonly threshold?: string;
  readonly ratePercent?: string;
}

export interface ContinuePolicyConfig {
  readonly maximumRounds: number;
  /** Target total rounds — ví dụ 1000, 1500 (không phải extendBy). */
  readonly presets: readonly number[];
}

export interface GamePolicyPreset {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly gameId?: string;
  readonly marketVersion?: number;
  readonly markets?: readonly MarketDefinition[];
  readonly rewardMultiplier: string;
  readonly minimumBet: string;
  readonly maximumBet: string;
  readonly betStep: string;
  readonly rewardPolicy: RewardPolicyConfig;
  readonly continuePolicy: ContinuePolicyConfig;
  readonly builtin?: boolean;
  readonly createdAt?: string;
}

export type GamePolicyDraft = Omit<GamePolicyPreset, 'id' | 'createdAt' | 'builtin'> & {
  readonly id?: string;
};
