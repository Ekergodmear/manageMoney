/**
 * OptimizationEngine — composes Core SDK public capabilities (RFC-005).
 * Sprint 3.1B: identity property only; search deferred to Sprint 3.2.
 * @see docs/rfc/optimization/RFC-004-mathematical-model.md
 */

import { buildStatistics, buildStrategy, solve, validateCalculationRequest } from '@/public';

import { OptimizationReasons } from './models/optimization-explanation';
import { OptimizationErrorCodes } from './models/optimization-error';
import type { OptimizationRequest } from './models/optimization-request';
import type { OptimizationResult } from './models/optimization-result';

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

/**
 * Returns minimal feasible request per RFC-003/004.
 * v3.1B: identity branch only — if intent fits bankrollLimit, returns intent unchanged.
 */
export function optimize(request: OptimizationRequest): OptimizationResult {
  const validated = validateCalculationRequest(request.intent);
  if (validated.kind === 'failure') {
    return noFeasibleSolution();
  }

  const solved = solve(validated.value);
  if (solved.kind === 'failure') {
    return noFeasibleSolution();
  }

  const strategy = buildStrategy(solved.value.rounds);
  const statistics = buildStatistics(strategy);

  if (statistics.requiredBankrollAmount <= request.bankrollLimit) {
    return {
      kind: 'success',
      request: request.intent,
      explanation: {
        reason: OptimizationReasons.IDENTITY,
        profitReducedBy: 0,
        roundsReducedBy: 0,
      },
    };
  }

  return noFeasibleSolution();
}
