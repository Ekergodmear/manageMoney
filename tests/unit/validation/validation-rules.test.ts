import { describe, expect, it } from 'vitest';

import type { CalculationRequest } from '@/application/dto';
import { runPhase } from '@/core/validation/run-phase';
import { structuralRules } from '@/core/validation/rules/structural-rules';
import { businessRules } from '@/core/validation/rules/business-rules';
import { mathematicalRules } from '@/core/validation/rules/mathematical-rules';
import { ValidationCodes } from '@/core/validation/error-codes';

import { validCalculationRequest } from './fixtures';

describe('structuralRules — branch coverage', () => {
  it('passes valid request', () => {
    expect(runPhase(validCalculationRequest, structuralRules)).toEqual([]);
  });

  it('S006 missing targetProfit object', () => {
    const errors = runPhase(
      {
        ...validCalculationRequest,
        targetProfit: null as unknown as CalculationRequest['targetProfit'],
      },
      structuralRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.S006_TARGET_PROFIT_INVALID)).toBe(true);
  });

  it('S006 missing targetProfit mode', () => {
    const errors = runPhase(
      {
        ...validCalculationRequest,
        targetProfit: {} as CalculationRequest['targetProfit'],
      },
      structuralRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.S006_TARGET_PROFIT_INVALID)).toBe(true);
  });

  it('S001 and S006 fail for null request', () => {
    const errors = runPhase(null as unknown as CalculationRequest, structuralRules);
    expect(errors.some((e) => e.code === ValidationCodes.S001_REQUEST_INVALID)).toBe(true);
    expect(errors.some((e) => e.code === ValidationCodes.S006_TARGET_PROFIT_INVALID)).toBe(true);
  });

  it('S002 rewardMultiplier NaN', () => {
    const errors = runPhase(
      { ...validCalculationRequest, rewardMultiplier: Number.NaN },
      structuralRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.S002_REWARD_MULTIPLIER_NAN)).toBe(true);
  });

  it('S013 rewardMultiplier too many decimal places', () => {
    const errors = runPhase(
      { ...validCalculationRequest, rewardMultiplier: 1.333 },
      structuralRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.S013_REWARD_MULTIPLIER_PRECISION)).toBe(
      true,
    );
  });

  it('S013 passes for two decimal places', () => {
    const errors = runPhase(
      { ...validCalculationRequest, rewardMultiplier: 1.95 },
      structuralRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.S013_REWARD_MULTIPLIER_PRECISION)).toBe(
      false,
    );
  });

  it('S004 minimumBet NaN', () => {
    const errors = runPhase(
      { ...validCalculationRequest, minimumBet: Number.NaN },
      structuralRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.S004_MINIMUM_BET_NAN)).toBe(true);
  });

  it('S005 betStep NaN', () => {
    const errors = runPhase({ ...validCalculationRequest, betStep: Number.NaN }, structuralRules);
    expect(errors.some((e) => e.code === ValidationCodes.S005_BET_STEP_NAN)).toBe(true);
  });

  it('S003 roundCount NaN', () => {
    const errors = runPhase(
      { ...validCalculationRequest, roundCount: Number.NaN },
      structuralRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.S003_ROUND_COUNT_NAN)).toBe(true);
  });

  it('S007 roundCount non-integer', () => {
    const errors = runPhase({ ...validCalculationRequest, roundCount: 1.5 }, structuralRules);
    expect(errors.some((e) => e.code === ValidationCodes.S007_ROUND_COUNT_NOT_INTEGER)).toBe(true);
  });

  it('S008 minimumBet non-integer', () => {
    const errors = runPhase({ ...validCalculationRequest, minimumBet: 1.5 }, structuralRules);
    expect(errors.some((e) => e.code === ValidationCodes.S008_MINIMUM_BET_NOT_INTEGER)).toBe(true);
  });

  it('S009 betStep non-integer', () => {
    const errors = runPhase({ ...validCalculationRequest, betStep: 1.5 }, structuralRules);
    expect(errors.some((e) => e.code === ValidationCodes.S009_BET_STEP_NOT_INTEGER)).toBe(true);
  });

  it('S006 invalid targetProfit mode', () => {
    const request = {
      ...validCalculationRequest,
      targetProfit: { mode: 'unknown' },
    } as unknown as CalculationRequest;
    const errors = runPhase(request, structuralRules);
    expect(errors.some((e) => e.code === ValidationCodes.S006_TARGET_PROFIT_INVALID)).toBe(true);
  });

  it('S010 fixedAmount NaN', () => {
    const errors = runPhase(
      {
        ...validCalculationRequest,
        targetProfit: { mode: 'fixedAmount', amount: Number.NaN },
      },
      structuralRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.S010_FIXED_AMOUNT_NAN)).toBe(true);
  });

  it('S011 fixedAmount non-integer', () => {
    const errors = runPhase(
      {
        ...validCalculationRequest,
        targetProfit: { mode: 'fixedAmount', amount: 1.5 },
      },
      structuralRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.S011_FIXED_AMOUNT_NOT_INTEGER)).toBe(true);
  });

  it('S012 percentage NaN', () => {
    const errors = runPhase(
      {
        ...validCalculationRequest,
        targetProfit: { mode: 'percentage', percentage: Number.NaN },
      },
      structuralRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.S012_PERCENTAGE_NAN)).toBe(true);
  });

  it('skips mode-specific rules for breakEven', () => {
    const errors = runPhase(
      {
        ...validCalculationRequest,
        targetProfit: { mode: 'breakEven' },
      },
      structuralRules,
    );
    expect(errors).toEqual([]);
  });
});

describe('businessRules — branch coverage', () => {
  it('passes valid request', () => {
    expect(runPhase(validCalculationRequest, businessRules)).toEqual([]);
  });

  it('B003 minimumBet zero', () => {
    const errors = runPhase({ ...validCalculationRequest, minimumBet: 0 }, businessRules);
    expect(errors.some((e) => e.code === ValidationCodes.B003_MINIMUM_BET_TOO_LOW)).toBe(true);
  });

  it('B004 betStep zero', () => {
    const errors = runPhase({ ...validCalculationRequest, betStep: 0 }, businessRules);
    expect(errors.some((e) => e.code === ValidationCodes.B004_BET_STEP_TOO_LOW)).toBe(true);
  });

  it('B002 roundCount zero', () => {
    const errors = runPhase({ ...validCalculationRequest, roundCount: 0 }, businessRules);
    expect(errors.some((e) => e.code === ValidationCodes.B002_ROUND_COUNT_TOO_LOW)).toBe(true);
  });

  it('B006 negative fixed amount', () => {
    const errors = runPhase(
      {
        ...validCalculationRequest,
        targetProfit: { mode: 'fixedAmount', amount: -1 },
      },
      businessRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.B006_FIXED_AMOUNT_NEGATIVE)).toBe(true);
  });

  it('B007 negative percentage', () => {
    const errors = runPhase(
      {
        ...validCalculationRequest,
        targetProfit: { mode: 'percentage', percentage: -1 },
      },
      businessRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.B007_PERCENTAGE_NEGATIVE)).toBe(true);
  });

  it('B008 percentage too high', () => {
    const errors = runPhase(
      {
        ...validCalculationRequest,
        targetProfit: { mode: 'percentage', percentage: 1001 },
      },
      businessRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.B008_PERCENTAGE_TOO_HIGH)).toBe(true);
  });
});

describe('mathematicalRules — branch coverage', () => {
  it('passes valid request', () => {
    expect(runPhase(validCalculationRequest, mathematicalRules)).toEqual([]);
  });

  it('M001 percentage below safe integer range', () => {
    const errors = runPhase(
      {
        ...validCalculationRequest,
        targetProfit: { mode: 'percentage', percentage: -Number.MAX_SAFE_INTEGER - 1 },
      },
      mathematicalRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.M001_FIELD_OVERFLOW)).toBe(true);
  });

  it('M002 roundCount exceeds safe integer', () => {
    const errors = runPhase(
      {
        ...validCalculationRequest,
        roundCount: Number.MAX_SAFE_INTEGER + 1,
      },
      mathematicalRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.M002_SOLVER_OVERFLOW_RISK)).toBe(true);
  });

  it('M002 solver overflow via roundCount bound', () => {
    const errors = runPhase(
      {
        rewardMultiplier: 20,
        roundCount: 9_007_199_254_740_990,
        minimumBet: 1_000,
        betStep: 1_000,
        targetProfit: { mode: 'breakEven' },
      },
      mathematicalRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.M002_SOLVER_OVERFLOW_RISK)).toBe(true);
  });

  it('M001 rewardMultiplier overflow', () => {
    const errors = runPhase(
      {
        ...validCalculationRequest,
        rewardMultiplier: Number.MAX_SAFE_INTEGER + 1,
      },
      mathematicalRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.M001_FIELD_OVERFLOW)).toBe(true);
  });

  it('M001 field overflow', () => {
    const errors = runPhase(
      {
        ...validCalculationRequest,
        minimumBet: Number.MAX_SAFE_INTEGER + 1,
      },
      mathematicalRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.M001_FIELD_OVERFLOW)).toBe(true);
  });

  it('M001 fixedAmount overflow', () => {
    const errors = runPhase(
      {
        ...validCalculationRequest,
        targetProfit: { mode: 'fixedAmount', amount: Number.MAX_SAFE_INTEGER + 1 },
      },
      mathematicalRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.M001_FIELD_OVERFLOW)).toBe(true);
  });

  it('M001 percentage overflow', () => {
    const errors = runPhase(
      {
        ...validCalculationRequest,
        targetProfit: { mode: 'percentage', percentage: Number.MAX_SAFE_INTEGER + 1 },
      },
      mathematicalRules,
    );
    expect(errors.some((e) => e.code === ValidationCodes.M001_FIELD_OVERFLOW)).toBe(true);
  });
});
