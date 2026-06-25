/**
 * fast-check arbitraries for ConstraintSolver property / differential tests.
 */

import fc from 'fast-check';

import type { CalculationRequest, TargetProfit } from '@/application/dto';

import { isValidRequest } from './solver-test-helpers';

const targetProfitArb: fc.Arbitrary<TargetProfit> = fc.oneof(
  fc.constant({ mode: 'breakEven' as const }),
  fc.integer({ min: 0, max: 200_000 }).map((amount) => ({ mode: 'fixedAmount' as const, amount })),
  fc
    .integer({ min: 0, max: 100 })
    .map((percentage) => ({ mode: 'percentage' as const, percentage })),
);

function buildRequestArb(roundCountMax: number): fc.Arbitrary<CalculationRequest> {
  return fc
    .tuple(
      fc.integer({ min: 2, max: 30 }),
      fc.integer({ min: 1, max: roundCountMax }),
      fc.integer({ min: 100, max: 2_000 }),
      fc.integer({ min: 1, max: 25 }),
      targetProfitArb,
    )
    .map(([rewardMultiplier, roundCount, betStep, minMultiplier, targetProfit]) => ({
      rewardMultiplier,
      roundCount,
      betStep,
      minimumBet: betStep * minMultiplier,
      targetProfit,
    }))
    .filter(isValidRequest);
}

/** Level 2 — property tests (N up to 10). */
export const calculationRequestArb = buildRequestArb(10);

/** Level 3 — differential vs brute-force (N <= 5). */
export const smallCalculationRequestArb = buildRequestArb(5);
