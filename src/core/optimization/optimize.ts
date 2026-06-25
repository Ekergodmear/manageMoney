/**
 * OptimizationEngine — composes Core SDK public capabilities (RFC-005).
 * Sprint 3.2B: identity + profit search (first feasible wins).
 * @see docs/rfc/optimization/RFC-004-mathematical-model.md
 */

import type { CalculationRequest } from '@/application/dto';
import type { ProfitAmount } from '@/core/models';
import { buildStatistics, buildStrategy, solve, validateCalculationRequest } from '@/public';

import { OptimizationReasons } from './models/optimization-explanation';
import { OptimizationErrorCodes } from './models/optimization-error';
import type { OptimizationRequest } from './models/optimization-request';
import type { OptimizationResult } from './models/optimization-result';
import { defaultSearchPolicy } from './search-policy';

const NO_SOLUTION_EXPLANATION = {
  reason: OptimizationReasons.NO_FEASIBLE_SOLUTION,
  profitReducedBy: 0,
  roundsReducedBy: 0,
} as const;

function noFeasibleSolution(): OptimizationResult {
  return {
    kind: 'failure',
    code: OptimizationErrorCodes.NO_FEASIBLE_SOLUTION,
    explanation: NO_SOLUTION_EXPLANATION,
  };
}

function originalFixedProfit(intent: CalculationRequest): ProfitAmount | null {
  if (intent.targetProfit.mode !== 'fixedAmount') {
    return null;
  }
  return intent.targetProfit.amount;
}

function withFixedProfit(intent: CalculationRequest, amount: ProfitAmount): CalculationRequest {
  return {
    ...intent,
    targetProfit: { mode: 'fixedAmount', amount },
  };
}

/** Evaluate candidate via public API — engine only, not policy. */
function requiredBankrollFor(candidate: CalculationRequest): number | null {
  const validated = validateCalculationRequest(candidate);
  if (validated.kind === 'failure') {
    return null;
  }

  const solved = solve(validated.value);
  if (solved.kind === 'failure') {
    return null;
  }

  const strategy = buildStrategy(solved.value.rounds);
  const statistics = buildStatistics(strategy);
  return statistics.requiredBankrollAmount;
}

function isFeasible(candidate: CalculationRequest, bankrollLimit: number): boolean {
  const required = requiredBankrollFor(candidate);
  return required !== null && required <= bankrollLimit;
}

/**
 * Returns minimal feasible request per RFC-003/004.
 */
export function optimize(request: OptimizationRequest): OptimizationResult {
  const { intent, bankrollLimit, profitGranularity } = request;
  const policy = defaultSearchPolicy;

  if (isFeasible(intent, bankrollLimit)) {
    return {
      kind: 'success',
      request: intent,
      explanation: {
        reason: OptimizationReasons.IDENTITY,
        profitReducedBy: 0,
        roundsReducedBy: 0,
      },
    };
  }

  const originalProfit = originalFixedProfit(intent);
  if (originalProfit === null) {
    return noFeasibleSolution();
  }

  let currentProfit = originalProfit;
  let candidateProfit = policy.nextProfit(intent, currentProfit, profitGranularity);

  while (candidateProfit !== null) {
    const candidate = withFixedProfit(intent, candidateProfit);

    if (isFeasible(candidate, bankrollLimit)) {
      return {
        kind: 'success',
        request: candidate,
        explanation: {
          reason: OptimizationReasons.PROFIT_REDUCED,
          profitReducedBy: originalProfit - candidateProfit,
          roundsReducedBy: 0,
        },
      };
    }

    currentProfit = candidateProfit;
    candidateProfit = policy.nextProfit(intent, currentProfit, profitGranularity);
  }

  return noFeasibleSolution();
}
