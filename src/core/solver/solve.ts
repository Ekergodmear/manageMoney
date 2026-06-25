/**
 * ConstraintSolver — pure function over immutable ValidatedCalculationRequest.
 * @see docs/design/solver-pseudocode.md (FROZEN)
 * @see docs/SOLVER-CODING-RULES.md
 */

import type { ValidatedCalculationRequest } from '@/application/dto';
import type { Result } from '@/core/contracts';
import { success } from '@/core/contracts';
import type { Round, Strategy } from '@/core/models';
import {
  encodeRewardMultiplier,
  rewardFromBet,
} from '@/core/monetary/reward-multiplier-encoding';

import { resolveTarget } from './resolve-target';
import { solveMinimalFeasibleBet } from './solve-minimal-feasible-bet';
import type { SolverError } from './solver-error';

export function solve(validated: ValidatedCalculationRequest): Result<Strategy, SolverError> {
  const encodedRewardMultiplier = encodeRewardMultiplier(validated.rewardMultiplier);
  const minimumBet = validated.minimumBet;
  const betStep = validated.betStep;
  const roundCount = validated.roundCount;
  const targetProfit = validated.targetProfit;

  let accumulatedSpent = 0;
  const rounds: Round[] = [];

  for (let i = 1; i <= roundCount; i++) {
    const accumulatedSpentBefore = accumulatedSpent;
    const pStar = resolveTarget(targetProfit, accumulatedSpentBefore);
    const bet = solveMinimalFeasibleBet(
      accumulatedSpentBefore,
      pStar,
      encodedRewardMultiplier,
      minimumBet,
      betStep,
    );
    const reward = rewardFromBet(bet, encodedRewardMultiplier);
    const accumulatedSpentAfter = accumulatedSpentBefore + bet;
    accumulatedSpent = accumulatedSpentAfter;

    rounds.push({
      index: i,
      betAmount: bet,
      rewardAmount: reward,
      accumulatedSpent: accumulatedSpentAfter,
    });
  }

  return success({ rounds });
}
