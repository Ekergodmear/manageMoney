/**
 * Brute-force Optimization oracle — test support only (Sprint 3.3C).
 * Enumerates small search spaces and picks lexicographic optimum per RFC-004.
 */

import type { CalculationRequest } from '@/application/dto';
import { createProfitCandidate, createRoundCandidate } from '@/core/optimization/candidates';
import { OptimizationReasons } from '@/core/optimization/models/optimization-explanation';
import { OptimizationErrorCodes } from '@/core/optimization/models/optimization-error';
import type { OptimizationRequest } from '@/core/optimization/models/optimization-request';
import type { OptimizationResult } from '@/core/optimization/models/optimization-result';
import { defaultSearchPolicy } from '@/core/optimization/search-policy';
import { buildStatistics, buildStrategy, solve, validateCalculationRequest } from '@/public';

const MAX_BRUTE_ROUNDS = 6;
const MAX_BRUTE_PROFIT = 50_000;

export function isWithinBruteForceBounds(request: OptimizationRequest): boolean {
  const { intent, profitGranularity } = request;

  if (intent.targetProfit.mode !== 'fixedAmount') {
    return false;
  }
  if (intent.roundCount > MAX_BRUTE_ROUNDS) {
    return false;
  }
  if (intent.targetProfit.amount > MAX_BRUTE_PROFIT) {
    return false;
  }
  if (profitGranularity <= 0 || profitGranularity > MAX_BRUTE_PROFIT) {
    return false;
  }

  return true;
}

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

export function isFeasibleCandidate(candidate: CalculationRequest, bankrollLimit: number): boolean {
  const required = requiredBankrollFor(candidate);
  return required !== null && required <= bankrollLimit;
}

export function distanceVector(
  original: CalculationRequest,
  candidate: CalculationRequest,
): readonly [profitLoss: number, roundLoss: number] {
  const originalProfit =
    original.targetProfit.mode === 'fixedAmount' ? original.targetProfit.amount : 0;
  const candidateProfit =
    candidate.targetProfit.mode === 'fixedAmount' ? candidate.targetProfit.amount : originalProfit;

  return [Math.max(0, originalProfit - candidateProfit), original.roundCount - candidate.roundCount];
}

export function isLexicographicallyBetter(
  left: readonly [number, number],
  right: readonly [number, number],
): boolean {
  if (left[0] !== right[0]) {
    return left[0] < right[0];
  }
  return left[1] < right[1];
}

function profitLevels(intent: CalculationRequest, profitGranularity: number): number[] {
  if (intent.targetProfit.mode !== 'fixedAmount') {
    return [];
  }

  const policy = defaultSearchPolicy;
  const levels: number[] = [];
  let current = intent.targetProfit.amount;

  levels.push(current);
  let next = policy.nextProfit(intent, current, profitGranularity);
  while (next !== null) {
    levels.push(next);
    current = next;
    next = policy.nextProfit(intent, current, profitGranularity);
  }

  return levels;
}

function roundLevels(intent: CalculationRequest, allowRoundReduction: boolean): number[] {
  const policy = defaultSearchPolicy;
  const levels: number[] = [intent.roundCount];

  if (!allowRoundReduction) {
    return levels;
  }

  let current = intent.roundCount;
  let next = policy.nextRoundCount(intent, current);
  while (next !== null) {
    levels.push(next);
    current = next;
    next = policy.nextRoundCount(intent, current);
  }

  return levels;
}

/** All candidates in the v1 search space (policy-aligned profit × round levels). */
export function enumerateSearchCandidates(request: OptimizationRequest): CalculationRequest[] {
  const { intent, profitGranularity, allowRoundReduction } = request;
  const candidates: CalculationRequest[] = [];

  for (const rounds of roundLevels(intent, allowRoundReduction)) {
    for (const profit of profitLevels(intent, profitGranularity)) {
      candidates.push(
        createProfitCandidate(createRoundCandidate(intent, rounds), profit),
      );
    }
  }

  return candidates;
}

function buildExplanation(
  original: CalculationRequest,
  candidate: CalculationRequest,
): OptimizationResult {
  const originalProfit =
    original.targetProfit.mode === 'fixedAmount' ? original.targetProfit.amount : 0;
  const originalRounds = original.roundCount;
  const candidateProfit =
    candidate.targetProfit.mode === 'fixedAmount' ? candidate.targetProfit.amount : originalProfit;
  const profitReducedBy = Math.max(0, originalProfit - candidateProfit);
  const roundsReducedBy = Math.max(0, originalRounds - candidate.roundCount);

  let reason = OptimizationReasons.IDENTITY;
  if (profitReducedBy > 0 && roundsReducedBy > 0) {
    reason = OptimizationReasons.PROFIT_AND_ROUNDS_REDUCED;
  } else if (profitReducedBy > 0) {
    reason = OptimizationReasons.PROFIT_REDUCED;
  } else if (roundsReducedBy > 0) {
    reason = OptimizationReasons.ROUNDS_REDUCED;
  }

  return {
    kind: 'success',
    request: candidate,
    explanation: { reason, profitReducedBy, roundsReducedBy },
  };
}

/**
 * Lexicographic brute-force optimum — returns `null` when out of bounds.
 * @see docs/rfc/optimization/RFC-004-mathematical-model.md
 */
export function bruteForceOptimize(request: OptimizationRequest): OptimizationResult | null {
  if (!isWithinBruteForceBounds(request)) {
    return null;
  }

  const { intent, bankrollLimit } = request;

  if (isFeasibleCandidate(intent, bankrollLimit)) {
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

  const candidates = enumerateSearchCandidates(request);
  const feasible = candidates.filter((candidate) => isFeasibleCandidate(candidate, bankrollLimit));

  if (feasible.length === 0) {
    return {
      kind: 'failure',
      code: OptimizationErrorCodes.NO_FEASIBLE_SOLUTION,
      explanation: {
        reason: OptimizationReasons.NO_FEASIBLE_SOLUTION,
        profitReducedBy: 0,
        roundsReducedBy: 0,
      },
    };
  }

  let best = feasible[0]!;
  for (const candidate of feasible.slice(1)) {
    if (
      isLexicographicallyBetter(distanceVector(intent, candidate), distanceVector(intent, best))
    ) {
      best = candidate;
    }
  }

  return buildExplanation(intent, best);
}

/** True when no feasible candidate is strictly better than `result` per RFC lexicographic order. */
export function hasNoBetterFeasibleCandidate(
  request: OptimizationRequest,
  result: OptimizationResult,
): boolean {
  if (!isWithinBruteForceBounds(request) || result.kind !== 'success') {
    return true;
  }

  const { intent } = request;
  const resultVector = distanceVector(intent, result.request);
  const candidates = enumerateSearchCandidates(request);

  for (const candidate of candidates) {
    if (!isFeasibleCandidate(candidate, request.bankrollLimit)) {
      continue;
    }
    const candidateVector = distanceVector(intent, candidate);
    if (isLexicographicallyBetter(candidateVector, resultVector)) {
      return false;
    }
  }

  return true;
}

/** True when failure means zero feasible candidates in the bounded search space. */
export function isExhaustiveFailure(request: OptimizationRequest, result: OptimizationResult): boolean {
  if (!isWithinBruteForceBounds(request) || result.kind !== 'failure') {
    return true;
  }

  const candidates = enumerateSearchCandidates(request);
  return !candidates.some((candidate) => isFeasibleCandidate(candidate, request.bankrollLimit));
}
