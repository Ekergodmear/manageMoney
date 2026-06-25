/**
 * Deterministic scenario interpreter — win-at-round-W evaluation.
 * @see docs/design/simulation-engine-spec.md (FROZEN)
 * @see ADR-036
 */

import type { Result } from '@/core/contracts';
import { failure, success } from '@/core/contracts';
import type { RoundResult, RoundSimulation, SimulationResult, Strategy } from '@/core/models';

import type { SimulationError } from './simulation-error';

function scenarioResultForIndex(index: number, winningRoundIndex: number): RoundResult {
  if (index < winningRoundIndex) {
    return 'Lose';
  }
  if (index === winningRoundIndex) {
    return 'Win';
  }
  return 'NotPlayed';
}

export function simulateWinAtRound(
  strategy: Strategy,
  winAtRound: number,
): Result<SimulationResult, SimulationError> {
  const rounds = strategy.rounds;
  const roundCount = rounds.length;

  if (roundCount === 0) {
    return failure('EMPTY_STRATEGY');
  }
  if (!Number.isInteger(winAtRound)) {
    return failure('WIN_ROUND_NOT_INTEGER');
  }
  if (winAtRound < 1 || winAtRound > roundCount) {
    return failure('WIN_ROUND_OUT_OF_RANGE');
  }

  const projections: RoundSimulation[] = [];

  for (let i = 0; i < roundCount; i++) {
    const round = rounds[i];
    if (round === undefined) {
      continue;
    }

    projections.push({
      index: round.index,
      result: scenarioResultForIndex(round.index, winAtRound),
      betAmount: round.betAmount,
      accumulatedSpent: round.accumulatedSpent,
    });
  }

  const winningRound = rounds[winAtRound - 1];
  if (winningRound === undefined) {
    return failure('WIN_ROUND_OUT_OF_RANGE');
  }

  return success({
    winningRoundIndex: winAtRound,
    profitAmount: winningRound.rewardAmount - winningRound.accumulatedSpent,
    requiredBankrollAmount: winningRound.accumulatedSpent,
    rounds: projections,
  });
}
