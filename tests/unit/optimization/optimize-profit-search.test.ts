/**
 * Sprint 3.2B — Profit search (first feasible wins).
 */

import { describe, expect, it, vi } from 'vitest';

import { optimize } from '@/core/optimization';
import { OptimizationReasons } from '@/core/optimization/models/optimization-explanation';
import * as publicApi from '@/public';
import {
  makeOptimizationRequest,
  measureRequiredBankroll,
  profitSearchIntent,
  withFixedProfit,
} from '../../support/optimization-test-helpers';

describe('optimize — profit search (Sprint 3.2B)', () => {
  it('returns PROFIT_REDUCED when a lower profit fits bankroll', () => {
    const fullRequired = measureRequiredBankroll(profitSearchIntent);
    const reducedIntent = withFixedProfit(profitSearchIntent, 95_000);
    const reducedRequired = measureRequiredBankroll(reducedIntent);

    expect(reducedRequired).toBeLessThan(fullRequired);

    const bankroll = reducedRequired;
    const result = optimize(makeOptimizationRequest(profitSearchIntent, bankroll));

    expect(result.kind).toBe('success');
    if (result.kind !== 'success') {
      return;
    }
    expect(result.explanation.reason).toBe(OptimizationReasons.PROFIT_REDUCED);
    expect(result.request.targetProfit).toEqual({ mode: 'fixedAmount', amount: 95_000 });
    expect(result.explanation.profitReducedBy).toBe(5_000);
    expect(result.explanation.roundsReducedBy).toBe(0);
  });

  it('first feasible wins — stops at highest feasible reduced profit', () => {
    const fullRequired = measureRequiredBankroll(profitSearchIntent);
    const firstReduced = withFixedProfit(profitSearchIntent, 95_000);
    const firstReducedRequired = measureRequiredBankroll(firstReduced);

    expect(firstReducedRequired).toBeLessThan(fullRequired);

    const validateSpy = vi.spyOn(publicApi, 'validateCalculationRequest');
    const bankroll = firstReducedRequired;

    optimize(makeOptimizationRequest(profitSearchIntent, bankroll));

    // identity evaluate + one candidate evaluate — no further profit steps
    expect(validateSpy).toHaveBeenCalledTimes(2);

    validateSpy.mockRestore();
  });

  it('preserves round count during profit-only search', () => {
    const reducedRequired = measureRequiredBankroll(withFixedProfit(profitSearchIntent, 95_000));

    const result = optimize(makeOptimizationRequest(profitSearchIntent, reducedRequired));

    expect(result.kind).toBe('success');
    if (result.kind !== 'success') {
      return;
    }
    expect(result.request.roundCount).toBe(profitSearchIntent.roundCount);
  });

  it('does not mutate original intent on profit search success', () => {
    const intent = structuredClone(profitSearchIntent);
    const frozen = structuredClone(intent);
    const reducedRequired = measureRequiredBankroll(withFixedProfit(intent, 95_000));

    optimize(makeOptimizationRequest(intent, reducedRequired));

    expect(intent).toEqual(frozen);
  });
});
