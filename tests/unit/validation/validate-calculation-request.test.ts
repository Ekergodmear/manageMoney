import { describe, expect, it } from 'vitest';

import type { CalculationRequest } from '@/application/dto';
import { validateCalculationRequest } from '@/core/validation';
import { ValidationCodes } from '@/core/validation/error-codes';

import { validCalculationRequest } from './fixtures';

describe('validateCalculationRequest — valid request', () => {
  it('returns ValidatedCalculationRequest on success', () => {
    const result = validateCalculationRequest(validCalculationRequest);

    expect(result.kind).toBe('success');
    if (result.kind === 'success') {
      expect(result.value).toBe(validCalculationRequest);
    }
  });
});

describe('validateCalculationRequest — immutability', () => {
  it('does not mutate input request', () => {
    const request: CalculationRequest = {
      rewardMultiplier: 20,
      roundCount: 5,
      minimumBet: 10_000,
      betStep: 1_000,
      targetProfit: { mode: 'breakEven' },
    };
    const snapshot = JSON.stringify(request);

    validateCalculationRequest(request);

    expect(JSON.stringify(request)).toBe(snapshot);
  });
});

describe('validateCalculationRequest — test cases 4, 5, 7', () => {
  it('Case 4 — invalid multiplier zero', () => {
    const result = validateCalculationRequest({
      ...validCalculationRequest,
      rewardMultiplier: 0,
    });

    expect(result.kind).toBe('failure');
    if (result.kind === 'failure') {
      expect(result.error.isValid).toBe(false);
      expect(
        result.error.errors.some((e) => e.code === ValidationCodes.B001_REWARD_MULTIPLIER_TOO_LOW),
      ).toBe(true);
    }
  });

  it('Case 5 — negative roundCount', () => {
    const result = validateCalculationRequest({
      ...validCalculationRequest,
      roundCount: -1,
    });

    expect(result.kind).toBe('failure');
    if (result.kind === 'failure') {
      expect(
        result.error.errors.some((e) => e.code === ValidationCodes.B002_ROUND_COUNT_TOO_LOW),
      ).toBe(true);
    }
  });

  it('Case 7 — minimumBet not multiple of betStep', () => {
    const result = validateCalculationRequest({
      ...validCalculationRequest,
      minimumBet: 10_500,
      betStep: 1_000,
    });

    expect(result.kind).toBe('failure');
    if (result.kind === 'failure') {
      expect(
        result.error.errors.some((e) => e.code === ValidationCodes.B005_MINIMUM_BET_STEP_MISMATCH),
      ).toBe(true);
    }
  });
});

describe('validateCalculationRequest — error shape', () => {
  it('includes code, path, layer, message and counts', () => {
    const result = validateCalculationRequest({
      ...validCalculationRequest,
      rewardMultiplier: Number.NaN,
    });

    expect(result.kind).toBe('failure');
    if (result.kind === 'failure') {
      const issue = result.error.errors[0];
      expect(issue).toMatchObject({
        code: ValidationCodes.S002_REWARD_MULTIPLIER_NAN,
        path: 'rewardMultiplier',
        layer: 'structural',
      });
      expect(typeof issue?.message).toBe('string');
      expect(result.error.errorCount).toBe(result.error.errors.length);
      expect(result.error.warningCount).toBe(0);
    }
  });
});
