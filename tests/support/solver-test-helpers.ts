/**
 * Shared helpers for ConstraintSolver tests (2.3F).
 */

import type { CalculationRequest, TargetProfit } from '@/application/dto';
import { resolveTarget } from '@/core/solver/resolve-target';
import { solve } from '@/core/solver';
import type { Strategy } from '@/core/models';
import { validateCalculationRequest } from '@/core/validation';

export function solveValidated(request: CalculationRequest): Strategy {
  const validated = validateCalculationRequest(request);
  if (validated.kind !== 'success') {
    throw new Error('expected valid request');
  }
  const result = solve(validated.value);
  if (result.kind !== 'success') {
    throw new Error('expected solve success');
  }
  return result.value;
}

export function requiredBankrollAmount(strategy: Strategy): number {
  const last = strategy.rounds.at(-1);
  if (last === undefined) {
    return 0;
  }
  return last.accumulatedSpent;
}

export function assertStrategyInvariants(request: CalculationRequest, strategy: Strategy): void {
  const m = request.rewardMultiplier;
  const bMin = request.minimumBet;
  const s = request.betStep;

  if (strategy.rounds.length !== request.roundCount) {
    throw new Error('round count mismatch');
  }

  for (let idx = 0; idx < strategy.rounds.length; idx++) {
    const round = strategy.rounds[idx];
    if (round === undefined) {
      throw new Error('missing round');
    }

    const previousRound = idx > 0 ? strategy.rounds[idx - 1] : undefined;
    const accumulatedSpentBefore = previousRound === undefined ? 0 : previousRound.accumulatedSpent;
    const target = resolveTarget(request.targetProfit, accumulatedSpentBefore);
    const profit = round.rewardAmount - round.accumulatedSpent;

    if (profit < target) {
      throw new Error(`I1 violated at round ${String(round.index)}`);
    }
    if (round.betAmount < bMin) {
      throw new Error(`I2 violated at round ${String(round.index)}`);
    }
    if (round.betAmount % s !== 0) {
      throw new Error(`I3 violated at round ${String(round.index)}`);
    }
    if (round.rewardAmount !== round.betAmount * m) {
      throw new Error(`I5 violated at round ${String(round.index)}`);
    }
    if (!Number.isInteger(round.betAmount)) {
      throw new Error(`I6 violated at round ${String(round.index)}`);
    }
    if (round.accumulatedSpent !== accumulatedSpentBefore + round.betAmount) {
      throw new Error(`I4/I8 violated at round ${String(round.index)}`);
    }

    if (previousRound !== undefined && round.accumulatedSpent <= previousRound.accumulatedSpent) {
      throw new Error(`monotonicity violated at round ${String(round.index)}`);
    }
  }
}

export function isValidRequest(request: CalculationRequest): boolean {
  return validateCalculationRequest(request).kind === 'success';
}

export function withTargetProfit(
  request: CalculationRequest,
  targetProfit: TargetProfit,
): CalculationRequest {
  return { ...request, targetProfit };
}

export function withMinimumBet(
  request: CalculationRequest,
  minimumBet: number,
): CalculationRequest {
  return { ...request, minimumBet };
}

export function withBetStep(request: CalculationRequest, betStep: number): CalculationRequest {
  return { ...request, betStep };
}
