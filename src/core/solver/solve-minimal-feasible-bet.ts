/**
 * SOLVE_MINIMAL_FEASIBLE_BET — frozen pseudo-code.
 * @see docs/design/solver-pseudocode.md
 */

import { ceilToStep } from './integer-math';

export function solveMinimalFeasibleBet(
  accumulatedSpentBefore: number,
  pStar: number,
  rewardMultiplier: number,
  minimumBet: number,
  betStep: number,
): number {
  const candidate = ceilToStep(accumulatedSpentBefore + pStar, rewardMultiplier - 1, betStep);
  return Math.max(minimumBet, candidate);
}
