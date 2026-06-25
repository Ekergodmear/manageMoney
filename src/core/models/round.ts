/**
 * Single betting attempt — raw input data only.
 * FORBIDDEN on Round (forever): profitAmount, roi — derived values belong elsewhere.
 * @see docs/DOMAIN-LANGUAGE.md
 */

import type { BetAmount, BankrollAmount, RewardAmount } from './amounts';

export interface Round {
  readonly index: number;
  readonly betAmount: BetAmount;
  readonly rewardAmount: RewardAmount;
  /** AccumulatedSpentAfterRound (Aᵢ) — sum of bets through this round inclusive. */
  readonly accumulatedSpent: BankrollAmount;
}
