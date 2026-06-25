/**
 * Sprint 3.2C.2 — Round reduction via nested RFC-004 search.
 */

import { describe, expect, it, vi } from 'vitest';

import type { CalculationRequest } from '@/application/dto';
import { optimize } from '@/core/optimization';
import { OptimizationReasons } from '@/core/optimization/models/optimization-explanation';
import type { OptimizationRequest } from '@/core/optimization/models/optimization-request';
import * as publicApi from '@/public';
import {
  makeOptimizationRequest,
  measureRequiredBankroll,
  profitSearchIntent,
  withFixedProfit,
} from '../../support/optimization-test-helpers';

function makeRequest(
  intent: CalculationRequest,
  bankrollLimit: number,
  allowRoundReduction: boolean,
): OptimizationRequest {
  return {
    ...makeOptimizationRequest(intent, bankrollLimit),
    allowRoundReduction,
  };
}

function profitFromRequest(request: CalculationRequest): number | null {
  if (request.targetProfit.mode !== 'fixedAmount') {
    return null;
  }
  return request.targetProfit.amount;
}

function collectEvaluatedPairs(bankrollLimit: number, allowRoundReduction: boolean): Array<{
  profit: number;
  rounds: number;
}> {
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

  optimize(makeRequest(profitSearchIntent, bankrollLimit, allowRoundReduction));

  validateSpy.mockRestore();
  return pairs;
}

describe('optimize — round search (Sprint 3.2C.2)', () => {
  it('does not reduce rounds when allowRoundReduction is false', () => {
    const bankroll = 950_000;
    const result = optimize(makeRequest(profitSearchIntent, bankroll, false));

    expect(result.kind).toBe('failure');
    if (result.kind !== 'failure') {
      return;
    }
    expect(result.code).toBe('NO_FEASIBLE_SOLUTION');
  });

  it('reduces rounds when profit search is exhausted at original round count', () => {
    const bankroll = 950_000;
    const result = optimize(makeRequest(profitSearchIntent, bankroll, true));

    expect(result.kind).toBe('success');
    if (result.kind !== 'success') {
      return;
    }
    expect(result.request.roundCount).toBeLessThan(profitSearchIntent.roundCount);
    expect(result.explanation.roundsReducedBy).toBeGreaterThan(0);
    expect(result.explanation.reason).toBe(OptimizationReasons.PROFIT_AND_ROUNDS_REDUCED);
  });

  it('exhausts profit search at original rounds before reducing rounds', () => {
    const reducedRequired = measureRequiredBankroll(withFixedProfit(profitSearchIntent, 95_000));
    const result = optimize(makeRequest(profitSearchIntent, reducedRequired, true));

    expect(result.kind).toBe('success');
    if (result.kind !== 'success') {
      return;
    }
    expect(result.explanation.reason).toBe(OptimizationReasons.PROFIT_REDUCED);
    expect(result.request.roundCount).toBe(profitSearchIntent.roundCount);
  });

  it('resets profit to original when trying a lower round count (RFC-004)', () => {
    const bankroll = 950_000;
    const pairs = collectEvaluatedPairs(bankroll, true);

    const lastAt50 = pairs.filter((p) => p.rounds === 50).at(-1);
    const firstAt49 = pairs.find((p) => p.rounds === 49);

    expect(lastAt50).toBeDefined();
    expect(firstAt49).toBeDefined();
    expect(firstAt49?.profit).toBe(100_000);
    expect(lastAt50!.rounds).toBe(50);
  });

  it('decrements rounds by one per policy step', () => {
    const pairs = collectEvaluatedPairs(950_000, true);
    const roundLevels = [...new Set(pairs.map((p) => p.rounds))].sort((a, b) => b - a);

    for (let i = 1; i < roundLevels.length; i++) {
      const prev = roundLevels[i - 1];
      const curr = roundLevels[i];
      if (prev !== undefined && curr !== undefined) {
        expect(prev - curr).toBe(1);
      }
    }
  });
});
