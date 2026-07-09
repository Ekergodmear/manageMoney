import { describe, expect, it } from 'vitest';

import type { CalculationRequest } from '@/application/dto';
import { validateCalculationRequest } from '@/core/validation';
import { ValidationCodes } from '@/core/validation/error-codes';

import { solveValidated } from '../../support/solver-test-helpers';
import { validCalculationRequest } from '../validation/fixtures';

describe('Arithmetic migration — decimal multiplier smoke', () => {
  it('9.8 — no IEEE float artifact (12000 × 9.8)', () => {
    const request: CalculationRequest = {
      rewardMultiplier: 9.8,
      roundCount: 5,
      minimumBet: 10_000,
      betStep: 1_000,
      targetProfit: { mode: 'fixedAmount', amount: 100_000 },
    };

    const strategy = solveValidated(request);
    const round1 = strategy.rounds[0];
    expect(round1).toBeDefined();
    if (round1 === undefined) {
      return;
    }

    expect(round1.betAmount).toBe(12_000);
    expect(round1.rewardAmount).toBe(117_600);
    expect(Number.isInteger(round1.rewardAmount)).toBe(true);
    expect(round1.rewardAmount).not.toBe(12000 * 9.8);
  });

  it('1.95 — integer rewards on standard lattice', () => {
    const request: CalculationRequest = {
      rewardMultiplier: 1.95,
      roundCount: 3,
      minimumBet: 10_000,
      betStep: 1_000,
      targetProfit: { mode: 'fixedAmount', amount: 50_000 },
    };

    const strategy = solveValidated(request);
    for (const round of strategy.rounds) {
      expect(Number.isInteger(round.rewardAmount)).toBe(true);
    }
  });
});

describe('Arithmetic migration — decimal precision validation', () => {
  it('rejects more than 2 decimal places', () => {
    for (const rewardMultiplier of [1.333, 19.678]) {
      const result = validateCalculationRequest({
        ...validCalculationRequest,
        rewardMultiplier,
      });
      expect(result.kind).toBe('failure');
      if (result.kind !== 'success') {
        expect(
          result.error.errors.some(
            (e) => e.code === ValidationCodes.S013_REWARD_MULTIPLIER_PRECISION,
          ),
        ).toBe(true);
      }
    }
  });

  it('accepts up to 2 decimal places', () => {
    for (const rewardMultiplier of [1.95, 19.6, 9.8, 20.2]) {
      const result = validateCalculationRequest({
        ...validCalculationRequest,
        rewardMultiplier,
      });
      expect(result.kind).toBe('success');
    }
  });
});
