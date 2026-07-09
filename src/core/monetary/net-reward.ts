/**
 * Net reward after optional tier win tax.
 * @see docs/design/tier-win-tax-brief.md
 */

import type { WinTax } from '@/application/dto';

import type { EncodedRewardMultiplier } from './reward-multiplier-encoding';
import { rewardFromBet } from './reward-multiplier-encoding';

export function grossRewardFromBet(bet: number, encoded: EncodedRewardMultiplier): number {
  return rewardFromBet(bet, encoded);
}

export function netRewardFromBet(
  bet: number,
  encoded: EncodedRewardMultiplier,
  winTax?: WinTax,
): number {
  const gross = grossRewardFromBet(bet, encoded);
  if (winTax === undefined || gross < winTax.threshold) {
    return gross;
  }
  return Math.floor((gross * (100 - winTax.ratePercent)) / 100);
}

export function profitIfWinAtBet(
  bet: number,
  accumulatedSpentBefore: number,
  encoded: EncodedRewardMultiplier,
  winTax?: WinTax,
): number {
  return netRewardFromBet(bet, encoded, winTax) - (accumulatedSpentBefore + bet);
}
