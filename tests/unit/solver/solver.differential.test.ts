/**
 * Level 3 — Differential testing: greedy vs brute-force (N <= 5).
 * @see docs/design/constraint-solver-formal-verification.md
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { solve } from '@/core/solver';
import { validateCalculationRequest } from '@/core/validation';

import { bruteForceSolve, totalBankroll } from '../../support/brute-force-solver';
import { smallCalculationRequestArb } from '../../support/solver-arbitraries';

describe('ConstraintSolver — differential (Level 3)', () => {
  it('greedy bankroll equals brute-force optimum for N <= 5', () => {
    fc.assert(
      fc.property(smallCalculationRequestArb, (request) => {
        const validated = validateCalculationRequest(request);
        if (validated.kind !== 'success') {
          return true;
        }

        const greedy = solve(validated.value);
        const brute = bruteForceSolve(validated.value);

        if (greedy.kind !== 'success' || brute === null) {
          return false;
        }

        return totalBankroll(greedy.value) === totalBankroll(brute);
      }),
      { numRuns: 150 },
    );
  });

  it('greedy bet sequence matches brute-force for N <= 5', () => {
    fc.assert(
      fc.property(smallCalculationRequestArb, (request) => {
        const validated = validateCalculationRequest(request);
        if (validated.kind !== 'success') {
          return true;
        }

        const greedy = solve(validated.value);
        const brute = bruteForceSolve(validated.value);

        if (greedy.kind !== 'success' || brute === null) {
          return false;
        }

        const greedyBets = greedy.value.rounds.map((r) => r.betAmount);
        const bruteBets = brute.rounds.map((r) => r.betAmount);
        return JSON.stringify(greedyBets) === JSON.stringify(bruteBets);
      }),
      { numRuns: 150 },
    );
  });

  it('brute-force is only used for N <= 5', () => {
    const validated = validateCalculationRequest({
      rewardMultiplier: 20,
      roundCount: 6,
      minimumBet: 10_000,
      betStep: 1_000,
      targetProfit: { mode: 'breakEven' },
    });
    expect(validated.kind).toBe('success');
    if (validated.kind === 'success') {
      expect(bruteForceSolve(validated.value)).toBeNull();
    }
  });
});
