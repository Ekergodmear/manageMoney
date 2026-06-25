import { describe, expect, it } from 'vitest';

import type { CalculationRequest } from '@/application/dto';
import { validateCalculationRequest } from '@/core/validation';
import { ValidationCodes } from '@/core/validation/error-codes';

import { validCalculationRequest } from './fixtures';

describe('Validation pipeline matrix', () => {
  it('structural fail — stops before business and mathematical', () => {
    const result = validateCalculationRequest(null as unknown as CalculationRequest);

    expect(result.kind).toBe('failure');
    if (result.kind === 'failure') {
      expect(result.error.errors.every((e) => e.layer === 'structural')).toBe(true);
      expect(result.error.errors.some((e) => e.code === ValidationCodes.S001_REQUEST_INVALID)).toBe(
        true,
      );
    }
  });

  it('business fail — structural pass, no mathematical errors', () => {
    const result = validateCalculationRequest({
      ...validCalculationRequest,
      rewardMultiplier: 1,
    });

    expect(result.kind).toBe('failure');
    if (result.kind === 'failure') {
      expect(result.error.errors.every((e) => e.layer === 'business')).toBe(true);
      expect(
        result.error.errors.some((e) => e.code === ValidationCodes.B001_REWARD_MULTIPLIER_TOO_LOW),
      ).toBe(true);
    }
  });

  it('mathematical fail — structural and business pass', () => {
    const result = validateCalculationRequest({
      rewardMultiplier: 20,
      roundCount: 9_007_199_254_740_990,
      minimumBet: 1_000,
      betStep: 1_000,
      targetProfit: { mode: 'breakEven' },
    });

    expect(result.kind).toBe('failure');
    if (result.kind === 'failure') {
      expect(result.error.errors.every((e) => e.layer === 'mathematical')).toBe(true);
      expect(
        result.error.errors.some((e) => e.code === ValidationCodes.M002_SOLVER_OVERFLOW_RISK),
      ).toBe(true);
    }
  });

  it('all phases pass', () => {
    const result = validateCalculationRequest(validCalculationRequest);
    expect(result.kind).toBe('success');
  });
});
