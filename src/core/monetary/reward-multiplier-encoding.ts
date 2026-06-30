/**
 * Internal fixed-point encoding for rewardMultiplier.
 * Not part of the public API — scale is an implementation detail.
 * @see docs/design/arithmetic-migration-brief.md
 */

/** Supports public contract: up to 2 decimal places on rewardMultiplier. */
export const REWARD_MULTIPLIER_DECIMAL_PLACES = 2;

const SCALE = 10 ** REWARD_MULTIPLIER_DECIMAL_PLACES;

const PRECISION_EPSILON = 1e-6;

export interface EncodedRewardMultiplier {
  readonly scaled: number;
  readonly scale: number;
}

export function hasAtMostTwoDecimalPlaces(value: number): boolean {
  if (!Number.isFinite(value)) {
    return false;
  }

  const scaled = Math.round(value * SCALE);
  return Math.abs(value * SCALE - scaled) <= PRECISION_EPSILON;
}

export function encodeRewardMultiplier(value: number): EncodedRewardMultiplier {
  return {
    scaled: Math.round(value * SCALE),
    scale: SCALE,
  };
}

/** M − 1 in scaled form: (Mᵢ − scale). */
export function scaledProfitMargin(encoded: EncodedRewardMultiplier): number {
  return encoded.scaled - encoded.scale;
}

/** Reward for a bet on the integer lattice — no IEEE float multiply. */
export function rewardFromBet(bet: number, encoded: EncodedRewardMultiplier): number {
  return (bet * encoded.scaled) / encoded.scale;
}

/** Minimum reward at minimumBet — for overflow guards in validation. */
export function minimumRewardAmount(minimumBet: number, encoded: EncodedRewardMultiplier): number {
  return rewardFromBet(minimumBet, encoded);
}
