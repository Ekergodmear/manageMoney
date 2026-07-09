/**
 * Brute-force oracle for differential testing — test-only, N <= 5.
 * Finds minimum-bankroll valid strategy by exhaustive search on discrete domain D.
 */

import type { ValidatedCalculationRequest } from '@/application/dto';
import type { Round, Strategy } from '@/core/models';
import { encodeRewardMultiplier, rewardFromBet } from '@/core/monetary/reward-multiplier-encoding';

import { solve } from '@/core/solver';
import { resolveTarget } from '@/core/solver/resolve-target';
import { solveMinimalFeasibleBet } from '@/core/solver/solve-minimal-feasible-bet';

/** Extra steps above per-round minimum — oracle explores non-greedy bets. */
const MAX_EXTRA_STEPS = 12;

function buildStrategy(request: ValidatedCalculationRequest, bets: readonly number[]): Strategy {
  const encoded = encodeRewardMultiplier(request.rewardMultiplier);
  let accumulatedBefore = 0;
  const rounds: Round[] = [];

  for (let i = 0; i < bets.length; i++) {
    const bet = bets[i] ?? 0;
    const accumulatedAfter = accumulatedBefore + bet;
    rounds.push({
      index: i + 1,
      betAmount: bet,
      rewardAmount: rewardFromBet(bet, encoded),
      accumulatedSpent: accumulatedAfter,
    });
    accumulatedBefore = accumulatedAfter;
  }

  return { rounds };
}

function partialTotal(bets: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < bets.length; i++) {
    sum += bets[i] ?? 0;
  }
  return sum;
}

function search(
  request: ValidatedCalculationRequest,
  round: number,
  accumulatedBefore: number,
  bets: number[],
  best: { total: number; bets: readonly number[] | null },
): void {
  const spent = partialTotal(bets);
  if (spent >= best.total) {
    return;
  }

  if (round > request.roundCount) {
    if (spent < best.total) {
      best.total = spent;
      best.bets = [...bets];
    }
    return;
  }

  const pStar = resolveTarget(request.targetProfit, accumulatedBefore);
  const encoded = encodeRewardMultiplier(request.rewardMultiplier);
  const minBet = solveMinimalFeasibleBet(
    accumulatedBefore,
    pStar,
    encoded,
    request.minimumBet,
    request.betStep,
  );
  const maxBet = minBet + request.betStep * MAX_EXTRA_STEPS;

  for (let bet = minBet; bet <= maxBet; bet += request.betStep) {
    const reward = rewardFromBet(bet, encoded);
    const accumulatedAfter = accumulatedBefore + bet;
    if (reward - accumulatedAfter >= pStar) {
      bets.push(bet);
      search(request, round + 1, accumulatedAfter, bets, best);
      bets.pop();
    }
  }
}

export function bruteForceSolve(request: ValidatedCalculationRequest): Strategy | null {
  if (request.roundCount > 5) {
    return null;
  }

  const greedy = solve(request);
  if (greedy.kind !== 'success') {
    return null;
  }

  const greedyTotal = totalBankroll(greedy.value);
  const best: { total: number; bets: readonly number[] | null } = {
    total: greedyTotal,
    bets: null,
  };

  search(request, 1, 0, [], best);

  if (best.bets === null) {
    return greedy.value;
  }

  return buildStrategy(request, best.bets);
}

export function totalBankroll(strategy: Strategy): number {
  return strategy.rounds.reduce((sum, r) => sum + r.betAmount, 0);
}
