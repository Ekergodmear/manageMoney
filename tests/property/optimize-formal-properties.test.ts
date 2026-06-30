/**
 * Sprint 3.3B — Formal properties not covered by Sprint 3.2 verification.
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { optimize } from '@/core/optimization';
import { OptimizationReasons } from '@/core/optimization/models/optimization-explanation';
import type { OptimizationRequest } from '@/core/optimization/models/optimization-request';
import {
  hasNoBetterFeasibleCandidate,
  isExhaustiveFailure,
} from '../support/brute-force-optimization';
import { smallFixedIntentArb } from '../support/optimization-arbitraries';
import { getDeterminismRuns, getPropertyRuns } from '../support/property-runs';
import { validCalculationRequest } from '../unit/validation/fixtures';
import { makeOptimizationRequest } from '../support/optimization-test-helpers';

const PROPERTY_RUNS = getPropertyRuns();
const DETERMINISM_RUNS = getDeterminismRuns();

function assertExplanationConsistency(
  request: OptimizationRequest,
  result: ReturnType<typeof optimize>,
): void {
  if (result.kind !== 'success') {
    return;
  }
  if (request.intent.targetProfit.mode !== 'fixedAmount') {
    return;
  }
  if (result.request.targetProfit.mode !== 'fixedAmount') {
    return;
  }

  const originalProfit = request.intent.targetProfit.amount;
  const optimizedProfit = result.request.targetProfit.amount;
  const originalRounds = request.intent.roundCount;
  const optimizedRounds = result.request.roundCount;

  expect(result.explanation.profitReducedBy).toBe(Math.max(0, originalProfit - optimizedProfit));
  expect(result.explanation.roundsReducedBy).toBe(Math.max(0, originalRounds - optimizedRounds));

  const profitReduced = result.explanation.profitReducedBy > 0;
  const roundsReduced = result.explanation.roundsReducedBy > 0;

  if (profitReduced && roundsReduced) {
    expect(result.explanation.reason).toBe(OptimizationReasons.PROFIT_AND_ROUNDS_REDUCED);
  } else if (profitReduced) {
    expect(result.explanation.reason).toBe(OptimizationReasons.PROFIT_REDUCED);
  } else if (roundsReduced) {
    expect(result.explanation.reason).toBe(OptimizationReasons.ROUNDS_REDUCED);
  } else {
    expect(result.explanation.reason).toBe(OptimizationReasons.IDENTITY);
  }
}

describe('Optimization — formal properties (Sprint 3.3B)', () => {
  it('O-P1 — determinism: optimize(x) === optimize(x)', () => {
    fc.assert(
      fc.property(smallFixedIntentArb, (request) => {
        const first = optimize(request);
        const second = optimize(request);
        return JSON.stringify(first) === JSON.stringify(second);
      }),
      { numRuns: DETERMINISM_RUNS },
    );
  });

  it('O-P2 — minimal change: no lexicographically better feasible candidate (bounded)', () => {
    fc.assert(
      fc.property(smallFixedIntentArb, (request) => {
        const result = optimize(request);
        return hasNoBetterFeasibleCandidate(request, result);
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('O-P3 — explanation consistency: deltas match request deltas', () => {
    fc.assert(
      fc.property(smallFixedIntentArb, (request) => {
        const result = optimize(request);
        try {
          assertExplanationConsistency(request, result);
          return true;
        } catch {
          return false;
        }
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('O-P4 — failure completeness: NO_FEASIBLE_SOLUTION implies empty feasible set (bounded)', () => {
    fc.assert(
      fc.property(smallFixedIntentArb, (request) => {
        const result = optimize(request);
        return isExhaustiveFailure(request, result);
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('O-P3 — explanation consistency: identity fixture', () => {
    const result = optimize(makeOptimizationRequest(validCalculationRequest, 10_000_000));
    assertExplanationConsistency(
      makeOptimizationRequest(validCalculationRequest, 10_000_000),
      result,
    );
  });
});
