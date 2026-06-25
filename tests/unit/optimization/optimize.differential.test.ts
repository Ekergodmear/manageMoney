/**
 * Sprint 3.3C — Differential testing: optimize() vs brute-force oracle.
 * @see docs/design/optimization-formal-verification.md
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { optimize } from '@/core/optimization';
import { bruteForceOptimize, isWithinBruteForceBounds } from '../../support/brute-force-optimization';
import { smallFixedIntentArb } from '../../support/optimization-arbitraries';

const DIFFERENTIAL_RUNS = 150;

function resultsMatch(
  engine: ReturnType<typeof optimize>,
  oracle: NonNullable<ReturnType<typeof bruteForceOptimize>>,
): boolean {
  if (engine.kind !== oracle.kind) {
    return false;
  }

  if (engine.kind === 'failure' && oracle.kind === 'failure') {
    return engine.code === oracle.code;
  }

  if (engine.kind !== 'success' || oracle.kind !== 'success') {
    return false;
  }

  return (
    engine.request.roundCount === oracle.request.roundCount &&
    JSON.stringify(engine.request.targetProfit) === JSON.stringify(oracle.request.targetProfit)
  );
}

describe('Optimization — differential (Sprint 3.3C)', () => {
  it('engine matches lexicographic brute-force for bounded inputs', () => {
    fc.assert(
      fc.property(smallFixedIntentArb, (request) => {
        const engine = optimize(request);
        const oracle = bruteForceOptimize(request);

        if (oracle === null) {
          return false;
        }

        return resultsMatch(engine, oracle);
      }),
      { numRuns: DIFFERENTIAL_RUNS },
    );
  });

  it('brute-force oracle is only defined for bounded search spaces', () => {
    const large = {
      intent: {
        rewardMultiplier: 20,
        roundCount: 7,
        minimumBet: 10_000,
        betStep: 1_000,
        targetProfit: { mode: 'fixedAmount' as const, amount: 10_000 },
      },
      bankrollLimit: 100_000,
      allowRoundReduction: true,
      profitGranularity: 5_000,
    };

    expect(isWithinBruteForceBounds(large)).toBe(false);
    expect(bruteForceOptimize(large)).toBeNull();
  });
});
