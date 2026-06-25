/**
 * Sprint 3.2C.2 commit 3 — Nested search verification (freeze gate).
 * Round monotonicity, nested prefix order, identity skips candidate builders.
 */

import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';

import * as candidateBuilders from '@/core/optimization/candidates';
import { optimize } from '@/core/optimization';
import { OptimizationReasons } from '@/core/optimization/models/optimization-explanation';
import * as publicApi from '@/public/capabilities';
import { validCalculationRequest } from '../validation/fixtures';
import {
  canonicalNestedEvaluationOrder,
  makeOptimizationRequest,
  profitFromRequest,
  profitSearchGranularity,
  profitSearchIntent,
} from '../../support/optimization-test-helpers';

const PROPERTY_RUNS = 100;

const bankrollMin = 300_000;
const bankrollMax = 1_600_000;
const bankrollArb = fc.integer({ min: bankrollMin, max: bankrollMax });

function collectEvaluatedPairs(
  bankrollLimit: number,
  allowRoundReduction: boolean,
): Array<{ profit: number; rounds: number }> {
  const pairs: Array<{ profit: number; rounds: number }> = [];
  const originalValidate = publicApi.validateCalculationRequest;
  const validateSpy = vi.spyOn(publicApi, 'validateCalculationRequest');

  validateSpy.mockImplementation((request) => {
    const profit = profitFromRequest(request);
    if (profit !== null) {
      pairs.push({ profit, rounds: request.roundCount });
    }
    return originalValidate(request);
  });

  optimize({
    ...makeOptimizationRequest(profitSearchIntent, bankrollLimit),
    allowRoundReduction,
  });

  validateSpy.mockRestore();
  return pairs;
}

function pairsEqual(
  a: { profit: number; rounds: number },
  b: { profit: number; rounds: number },
): boolean {
  return a.profit === b.profit && a.rounds === b.rounds;
}

describe('optimize — nested search properties (Sprint 3.2C.2)', () => {
  it('Round Monotonicity — allowRoundReduction=false never changes round count', () => {
    fc.assert(
      fc.property(bankrollArb, (bankroll) => {
        const result = optimize({
          ...makeOptimizationRequest(profitSearchIntent, bankroll),
          allowRoundReduction: false,
        });

        if (result.kind !== 'success') {
          return true;
        }

        return result.request.roundCount === profitSearchIntent.roundCount;
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('Round Monotonicity — round levels step down by one via policy', () => {
    fc.assert(
      fc.property(bankrollArb, (bankroll) => {
        const pairs = collectEvaluatedPairs(bankroll, true);
        const roundLevels = [...new Set(pairs.map((p) => p.rounds))].sort((a, b) => b - a);

        for (let i = 1; i < roundLevels.length; i++) {
          const prev = roundLevels[i - 1];
          const curr = roundLevels[i];
          if (prev !== undefined && curr !== undefined && prev - curr !== 1) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('Nested Prefix — evaluated pairs are a prefix of RFC-004 canonical order', () => {
    const canonical = canonicalNestedEvaluationOrder(
      profitSearchIntent,
      profitSearchGranularity,
      true,
    );

    fc.assert(
      fc.property(bankrollArb, (bankroll) => {
        const evaluated = collectEvaluatedPairs(bankroll, true);

        if (evaluated.length > canonical.length) {
          return false;
        }

        for (let i = 0; i < evaluated.length; i++) {
          const expected = canonical[i];
          const actual = evaluated[i];
          if (expected === undefined || actual === undefined || !pairsEqual(actual, expected)) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('Identity — candidate builders are not called when intent is feasible', () => {
    const profitSpy = vi.spyOn(candidateBuilders, 'createProfitCandidate');
    const roundSpy = vi.spyOn(candidateBuilders, 'createRoundCandidate');

    const result = optimize(makeOptimizationRequest(validCalculationRequest, 10_000_000));

    expect(result.kind).toBe('success');
    if (result.kind === 'success') {
      expect(result.explanation.reason).toBe(OptimizationReasons.IDENTITY);
    }
    expect(profitSpy).not.toHaveBeenCalled();
    expect(roundSpy).not.toHaveBeenCalled();

    profitSpy.mockRestore();
    roundSpy.mockRestore();
  });

  it('Nested Prefix — concrete RFC order at round boundary', () => {
    const canonical = canonicalNestedEvaluationOrder(
      profitSearchIntent,
      profitSearchGranularity,
      true,
    );
    const evaluated = collectEvaluatedPairs(950_000, true);

    const firstAt49Index = canonical.findIndex((p) => p.rounds === 49);
    const firstEvalAt49Index = evaluated.findIndex((p) => p.rounds === 49);

    expect(firstAt49Index).toBeGreaterThan(0);
    expect(firstEvalAt49Index).toBeGreaterThan(0);
    expect(canonical[firstAt49Index]).toEqual({ profit: 100_000, rounds: 49 });
    expect(evaluated[firstEvalAt49Index]).toEqual({ profit: 100_000, rounds: 49 });
    expect(evaluated).toEqual(canonical.slice(0, evaluated.length));
  });
});
