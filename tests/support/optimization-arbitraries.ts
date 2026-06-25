/**
 * fast-check arbitraries for Optimization formal verification (Sprint 3.3).
 */

import fc from 'fast-check';

import type { CalculationRequest } from '@/application/dto';
import type { OptimizationRequest } from '@/core/optimization/models/optimization-request';

import { isWithinBruteForceBounds } from './brute-force-optimization';

const GRANULARITY_CHOICES = [1_000, 2_000, 5_000, 10_000] as const;

export const smallFixedIntentArb: fc.Arbitrary<CalculationRequest> = fc
  .record({
    rewardMultiplier: fc.constant(20),
    roundCount: fc.integer({ min: 1, max: 6 }),
    minimumBet: fc.constant(10_000),
    betStep: fc.constant(1_000),
    targetProfitAmount: fc.integer({ min: 0, max: 50_000 }),
    profitGranularity: fc.constantFrom(...GRANULARITY_CHOICES),
    bankrollLimit: fc.integer({ min: 10_000, max: 500_000 }),
    allowRoundReduction: fc.boolean(),
  })
  .map(
    ({
      rewardMultiplier,
      roundCount,
      minimumBet,
      betStep,
      targetProfitAmount,
      profitGranularity,
      bankrollLimit,
      allowRoundReduction,
    }) => {
      const alignedProfit = Math.floor(targetProfitAmount / profitGranularity) * profitGranularity;
      const intent: CalculationRequest = {
        rewardMultiplier,
        roundCount,
        minimumBet,
        betStep,
        targetProfit: { mode: 'fixedAmount', amount: alignedProfit },
      };
      const request: OptimizationRequest = {
        intent,
        bankrollLimit,
        allowRoundReduction,
        profitGranularity,
      };
      return request;
    },
  )
  .filter(isWithinBruteForceBounds);
