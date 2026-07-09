/**
 * OptimizationEngine — composes Core SDK public capabilities (RFC-005).
 * Sprint 3.2C.2: identity + nested profit/round search (RFC-004).
 * @see docs/rfc/optimization/RFC-004-mathematical-model.md
 */

import type { CalculationRequest } from '@/application/dto';
import type { ProfitAmount } from '@/core/models';
import {
  buildStatistics,
  buildStrategy,
  solve,
  validateCalculationRequest,
} from '@/public/capabilities';

import { createProfitCandidate, createRoundCandidate } from './candidates';
import type { OptimizationExplanation } from './models/optimization-explanation';
import { OptimizationReasons } from './models/optimization-explanation';
import { OptimizationErrorCodes } from './models/optimization-error';
import type { OptimizationRequest } from './models/optimization-request';
import type { OptimizationResult } from './models/optimization-result';
import { defaultSearchPolicy } from './search-policy';
import type { SearchPolicy } from './search-policy';

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

function buildExplanation(
  originalProfit: ProfitAmount,
  originalRounds: number,
  candidate: CalculationRequest,
): OptimizationExplanation {
  const candidateProfit =
    candidate.targetProfit.mode === 'fixedAmount' ? candidate.targetProfit.amount : originalProfit;
  const profitReducedBy = Math.max(0, originalProfit - candidateProfit);
  const roundsReducedBy = Math.max(0, originalRounds - candidate.roundCount);

  if (profitReducedBy > 0 && roundsReducedBy > 0) {
    return {
      reason: OptimizationReasons.PROFIT_AND_ROUNDS_REDUCED,
      profitReducedBy,
      roundsReducedBy,
    };
  }
  if (profitReducedBy > 0) {
    return {
      reason: OptimizationReasons.PROFIT_REDUCED,
      profitReducedBy,
      roundsReducedBy: 0,
    };
  }
  if (roundsReducedBy > 0) {
    return {
      reason: OptimizationReasons.ROUNDS_REDUCED,
      profitReducedBy: 0,
      roundsReducedBy,
    };
  }

  return {
    reason: OptimizationReasons.IDENTITY,
    profitReducedBy: 0,
    roundsReducedBy: 0,
  };
}

function successResult(
  candidate: CalculationRequest,
  originalProfit: ProfitAmount,
  originalRounds: number,
): OptimizationResult {
  return {
    kind: 'success',
    request: candidate,
    explanation: buildExplanation(originalProfit, originalRounds, candidate),
  };
}

/**
 * RFC-004 inner profit loop at a fixed round count.
 * When `skipOriginalProfit` is true, the first step is `policy.nextProfit` (3.2B frozen path).
 */
function tryProfitSearchAtRounds(
  intent: CalculationRequest,
  searchRoundCount: number,
  bankrollLimit: number,
  profitGranularity: number,
  originalProfit: ProfitAmount,
  policy: SearchPolicy,
  skipOriginalProfit: boolean,
): CalculationRequest | null {
  const base = createRoundCandidate(intent, searchRoundCount);
  let currentProfit = originalProfit;

  if (!skipOriginalProfit) {
    const atOriginalProfit = createProfitCandidate(base, currentProfit);
    if (isFeasible(atOriginalProfit, bankrollLimit)) {
      return atOriginalProfit;
    }
  }

  let nextProfit = policy.nextProfit(intent, currentProfit, profitGranularity);
  while (nextProfit !== null) {
    const candidate = createProfitCandidate(base, nextProfit);
    if (isFeasible(candidate, bankrollLimit)) {
      return candidate;
    }
    currentProfit = nextProfit;
    nextProfit = policy.nextProfit(intent, currentProfit, profitGranularity);
  }

  return null;
}

/**
 * Returns minimal feasible request per RFC-003/004.
 */
export function optimize(request: OptimizationRequest): OptimizationResult {
  const { intent, bankrollLimit, profitGranularity, allowRoundReduction } = request;
  const policy = defaultSearchPolicy;
  const originalRounds = intent.roundCount;

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

  const profitOnly = tryProfitSearchAtRounds(
    intent,
    originalRounds,
    bankrollLimit,
    profitGranularity,
    originalProfit,
    policy,
    true,
  );
  if (profitOnly !== null) {
    return successResult(profitOnly, originalProfit, originalRounds);
  }

  if (!allowRoundReduction) {
    return noFeasibleSolution();
  }

  let currentRounds = originalRounds;
  let nextRounds = policy.nextRoundCount(intent, currentRounds);
  while (nextRounds !== null) {
    const withRoundReduction = tryProfitSearchAtRounds(
      intent,
      nextRounds,
      bankrollLimit,
      profitGranularity,
      originalProfit,
      policy,
      false,
    );
    if (withRoundReduction !== null) {
      return successResult(withRoundReduction, originalProfit, originalRounds);
    }

    currentRounds = nextRounds;
    nextRounds = policy.nextRoundCount(intent, currentRounds);
  }

  return noFeasibleSolution();
}
