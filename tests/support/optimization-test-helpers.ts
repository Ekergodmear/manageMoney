/**
 * Shared helpers for Optimization property / unit tests.
 */

import type { CalculationRequest } from '@/application/dto';
import { defaultSearchPolicy } from '@/core/optimization/search-policy';
import type { OptimizationRequest } from '@/core/optimization/models/optimization-request';
import type { OptimizationResult } from '@/core/optimization/models/optimization-result';
import * as publicApi from '@/public';

/** 50 rounds — profit reduction changes required bankroll. */
export const profitSearchIntent: CalculationRequest = {
  rewardMultiplier: 20,
  roundCount: 50,
  minimumBet: 10_000,
  betStep: 1_000,
  targetProfit: { mode: 'fixedAmount', amount: 100_000 },
};

export const profitSearchGranularity = 5_000;

export function makeOptimizationRequest(
  intent: CalculationRequest,
  bankrollLimit: number,
  profitGranularity = profitSearchGranularity,
): OptimizationRequest {
  return {
    intent,
    bankrollLimit,
    allowRoundReduction: true,
    profitGranularity,
  };
}

export function measureRequiredBankroll(intent: CalculationRequest): number {
  const validated = publicApi.validateCalculationRequest(intent);
  if (validated.kind === 'failure') {
    throw new Error('fixture must be valid');
  }
  const solved = publicApi.solve(validated.value);
  if (solved.kind === 'failure') {
    throw new Error('fixture must be solvable');
  }
  const strategy = publicApi.buildStrategy(solved.value.rounds);
  const statistics = publicApi.buildStatistics(strategy);
  return statistics.requiredBankrollAmount;
}

export function withFixedProfit(intent: CalculationRequest, amount: number): CalculationRequest {
  return {
    ...intent,
    targetProfit: { mode: 'fixedAmount', amount },
  };
}

/** Success profit amount, or `null` on failure / non-fixedAmount. */
export function optimizedProfitAmount(result: OptimizationResult): number | null {
  if (result.kind !== 'success') {
    return null;
  }
  if (result.request.targetProfit.mode !== 'fixedAmount') {
    return null;
  }
  return result.request.targetProfit.amount;
}

/** Profits evaluated by optimize — identity first, then policy candidates in order. */
export function canonicalProfitEvaluationOrder(
  intent: CalculationRequest,
  profitGranularity: number,
): number[] {
  if (intent.targetProfit.mode !== 'fixedAmount') {
    return [];
  }

  const order: number[] = [intent.targetProfit.amount];
  let current = intent.targetProfit.amount;
  let next = defaultSearchPolicy.nextProfit(intent, current, profitGranularity);

  while (next !== null) {
    order.push(next);
    current = next;
    next = defaultSearchPolicy.nextProfit(intent, current, profitGranularity);
  }

  return order;
}

export function isFeasibleUnderBankroll(
  intent: CalculationRequest,
  bankrollLimit: number,
): boolean {
  return measureRequiredBankroll(intent) <= bankrollLimit;
}

export interface EvaluatedPair {
  readonly profit: number;
  readonly rounds: number;
}

/** RFC-004 nested evaluation order — identity + profit at R₀ + (profit reset × round steps). */
export function canonicalNestedEvaluationOrder(
  intent: CalculationRequest,
  profitGranularity: number,
  allowRoundReduction: boolean,
): EvaluatedPair[] {
  if (intent.targetProfit.mode !== 'fixedAmount') {
    return [];
  }

  const policy = defaultSearchPolicy;
  const originalProfit = intent.targetProfit.amount;
  const originalRounds = intent.roundCount;
  const order: EvaluatedPair[] = [{ profit: originalProfit, rounds: originalRounds }];

  let currentProfit = originalProfit;
  let nextProfit = policy.nextProfit(intent, currentProfit, profitGranularity);
  while (nextProfit !== null) {
    order.push({ profit: nextProfit, rounds: originalRounds });
    currentProfit = nextProfit;
    nextProfit = policy.nextProfit(intent, currentProfit, profitGranularity);
  }

  if (!allowRoundReduction) {
    return order;
  }

  let currentRounds = originalRounds;
  let nextRounds = policy.nextRoundCount(intent, currentRounds);
  while (nextRounds !== null) {
    currentProfit = originalProfit;
    order.push({ profit: originalProfit, rounds: nextRounds });

    nextProfit = policy.nextProfit(intent, currentProfit, profitGranularity);
    while (nextProfit !== null) {
      order.push({ profit: nextProfit, rounds: nextRounds });
      currentProfit = nextProfit;
      nextProfit = policy.nextProfit(intent, currentProfit, profitGranularity);
    }

    currentRounds = nextRounds;
    nextRounds = policy.nextRoundCount(intent, currentRounds);
  }

  return order;
}

export function profitFromRequest(request: CalculationRequest): number | null {
  if (request.targetProfit.mode !== 'fixedAmount') {
    return null;
  }
  return request.targetProfit.amount;
}
