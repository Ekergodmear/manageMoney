/**
 * Sprint 3.2C.1 — Profit search verification (freeze gate).
 * Monotonic Budget + Prefix Stability — no new features.
 * @see docs/design/sprint-3.2-spec.md
 */

import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';

import { optimize } from '@/core/optimization';
import * as publicApi from '@/public';
import {
  canonicalProfitEvaluationOrder,
  isFeasibleUnderBankroll,
  makeOptimizationRequest,
  measureRequiredBankroll,
  optimizedProfitAmount,
  profitSearchGranularity,
  profitSearchIntent,
  withFixedProfit,
} from '../../support/optimization-test-helpers';

/** Each optimize() runs multiple pipeline evals — keep runs lower than solver P-tests. */
const PROPERTY_RUNS = 200;

const canonical = canonicalProfitEvaluationOrder(profitSearchIntent, profitSearchGranularity);

const bankrollMin = Math.min(
  ...canonical.map((profit) => measureRequiredBankroll(withFixedProfit(profitSearchIntent, profit))),
);
const bankrollMax = measureRequiredBankroll(profitSearchIntent);

const bankrollArb = fc.integer({ min: Math.floor(bankrollMin), max: Math.ceil(bankrollMax) });

function profitFromValidatedCall(request: { targetProfit: { mode: string; amount?: number } }): number | null {
  if (request.targetProfit.mode !== 'fixedAmount') {
    return null;
  }
  return request.targetProfit.amount ?? null;
}

function collectEvaluatedProfits(bankrollLimit: number): number[] {
  const profits: number[] = [];
  const originalValidate = publicApi.validateCalculationRequest;
  const validateSpy = vi.spyOn(publicApi, 'validateCalculationRequest');

  validateSpy.mockImplementation((request) => {
    const amount = profitFromValidatedCall(request);
    if (amount !== null) {
      profits.push(amount);
    }
    return originalValidate(request);
  });

  optimize(makeOptimizationRequest(profitSearchIntent, bankrollLimit));

  validateSpy.mockRestore();
  return profits;
}

describe('optimize — profit search properties (Sprint 3.2C.1)', () => {
  it('Monotonic Budget — higher bankroll never yields lower optimized profit', () => {
    fc.assert(
      fc.property(bankrollArb, bankrollArb, (b1, b2) => {
        const high = Math.max(b1, b2);
        const low = Math.min(b1, b2);

        const profitHigh = optimizedProfitAmount(
          optimize(makeOptimizationRequest(profitSearchIntent, high)),
        );
        const profitLow = optimizedProfitAmount(
          optimize(makeOptimizationRequest(profitSearchIntent, low)),
        );

        if (profitHigh === null && profitLow === null) {
          return true;
        }
        if (profitHigh !== null && profitLow === null) {
          return true;
        }
        if (profitHigh === null && profitLow !== null) {
          return false;
        }

        return profitHigh! >= profitLow!;
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('Prefix Stability — evaluated profits are a prefix of the canonical policy sequence', () => {
    fc.assert(
      fc.property(bankrollArb, (bankroll) => {
        const evaluated = collectEvaluatedProfits(bankroll);

        if (evaluated.length > canonical.length) {
          return false;
        }

        for (let i = 0; i < evaluated.length; i++) {
          if (evaluated[i] !== canonical[i]) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('Prefix Stability + First Feasible Wins — result is first feasible in canonical order', () => {
    fc.assert(
      fc.property(bankrollArb, (bankroll) => {
        const result = optimize(makeOptimizationRequest(profitSearchIntent, bankroll));
        const evaluated = collectEvaluatedProfits(bankroll);

        const firstFeasible = canonical.find((profit) =>
          isFeasibleUnderBankroll(withFixedProfit(profitSearchIntent, profit), bankroll),
        );

        if (firstFeasible === undefined) {
          return result.kind === 'failure' && evaluated.length === canonical.length;
        }

        if (result.kind !== 'success') {
          return false;
        }

        const resultProfit = optimizedProfitAmount(result);
        if (resultProfit === null || resultProfit !== firstFeasible) {
          return false;
        }

        const stopIndex = evaluated.indexOf(resultProfit);
        return stopIndex === evaluated.length - 1;
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('Prefix Stability — concrete: 95k feasible stops before 90k is evaluated', () => {
    const bankroll = measureRequiredBankroll(withFixedProfit(profitSearchIntent, 95_000));
    const evaluated = collectEvaluatedProfits(bankroll);

    expect(evaluated).toEqual([100_000, 95_000]);
    expect(evaluated).toEqual(canonical.slice(0, 2));

    const result = optimize(makeOptimizationRequest(profitSearchIntent, bankroll));
    expect(optimizedProfitAmount(result)).toBe(95_000);
  });
});
