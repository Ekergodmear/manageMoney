/**
 * Canonical derived data calculator for StrategyStatistics.
 * @see docs/design/statistics-builder-spec.md (FROZEN)
 * @see ADR-035
 */

import type { Strategy, StrategyStatistics } from '@/core/models';

const EMPTY_STATISTICS: StrategyStatistics = {
  roundCount: 0,
  requiredBankrollAmount: 0,
  maximumBetAmount: 0,
  averageBetAmount: 0,
  minimumBetAmount: 0,
  expectedProfitAmount: 0,
};

/**
 * Observational only — derives statistics from Strategy; never mutates input.
 * Ownership: returns an immutable snapshot independent of later Strategy changes.
 */
export function buildStatistics(strategy: Strategy): StrategyStatistics {
  const rounds = strategy.rounds;
  const roundCount = rounds.length;

  if (roundCount === 0) {
    return EMPTY_STATISTICS;
  }

  const first = rounds[0];
  if (first === undefined) {
    return EMPTY_STATISTICS;
  }

  let sumBet = 0;
  let maximumBetAmount = first.betAmount;
  let minimumBetAmount = first.betAmount;

  for (let i = 0; i < roundCount; i++) {
    const round = rounds[i];
    if (round === undefined) {
      continue;
    }
    const bet = round.betAmount;
    sumBet += bet;
    if (bet > maximumBetAmount) {
      maximumBetAmount = bet;
    }
    if (bet < minimumBetAmount) {
      minimumBetAmount = bet;
    }
  }

  const last = rounds[roundCount - 1];
  if (last === undefined) {
    return EMPTY_STATISTICS;
  }

  return {
    roundCount,
    requiredBankrollAmount: last.accumulatedSpent,
    maximumBetAmount,
    averageBetAmount: Math.floor(sumBet / roundCount),
    minimumBetAmount,
    expectedProfitAmount: last.rewardAmount - last.accumulatedSpent,
  };
}
