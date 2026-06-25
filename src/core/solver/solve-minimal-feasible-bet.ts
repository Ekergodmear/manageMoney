/**
 * SOLVE_MINIMAL_FEASIBLE_BET — frozen pseudo-code.
 * @see docs/design/solver-pseudocode.md
 */

import type { EncodedRewardMultiplier } from '@/core/monetary/reward-multiplier-encoding';
import { scaledProfitMargin } from '@/core/monetary/reward-multiplier-encoding';

import { ceilToStep } from './integer-math';

export function solveMinimalFeasibleBet(
  accumulatedSpentBefore: number,
  pStar: number,
  encodedRewardMultiplier: EncodedRewardMultiplier,
  minimumBet: number,
  betStep: number,
): number {
  const numerator = (accumulatedSpentBefore + pStar) * encodedRewardMultiplier.scale;
  const candidate = ceilToStep(
    numerator,
    scaledProfitMargin(encodedRewardMultiplier),
    betStep,
  );
  return Math.max(minimumBet, candidate);
}
