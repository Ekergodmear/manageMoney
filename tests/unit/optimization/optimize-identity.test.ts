/**
 * Sprint 3.1B — Identity property (RFC-005).
 */

import { describe, expect, it, vi } from 'vitest';

import type { CalculationRequest } from '@/application/dto';
import { optimize } from '@/core/optimization';
import { OptimizationReasons } from '@/core/optimization/models/optimization-explanation';
import { OptimizationErrorCodes } from '@/core/optimization/models/optimization-error';
import type { OptimizationRequest } from '@/core/optimization/models/optimization-request';
import * as publicApi from '@/public/capabilities';
import { validCalculationRequest } from '../validation/fixtures';

function makeRequest(intent: CalculationRequest, bankrollLimit: number): OptimizationRequest {
  return {
    intent,
    bankrollLimit,
    allowRoundReduction: true,
    profitGranularity: 5_000,
  };
}

describe('optimize — identity property (Sprint 3.1B)', () => {
  it('returns intent unchanged when requiredBankroll <= bankrollLimit', () => {
    const request = makeRequest(validCalculationRequest, 10_000_000);

    const result = optimize(request);

    expect(result.kind).toBe('success');
    if (result.kind !== 'success') {
      return;
    }
    expect(result.request).toEqual(validCalculationRequest);
    expect(result.request).toBe(request.intent);
  });

  it('sets explanation.reason to IDENTITY on identity success', () => {
    const request = makeRequest(validCalculationRequest, 10_000_000);

    const result = optimize(request);

    expect(result.kind).toBe('success');
    if (result.kind !== 'success') {
      return;
    }
    expect(result.explanation.reason).toBe(OptimizationReasons.IDENTITY);
    expect(result.explanation.profitReducedBy).toBe(0);
    expect(result.explanation.roundsReducedBy).toBe(0);
  });

  it('does not mutate CalculationRequest fields on identity success', () => {
    const intent: CalculationRequest = {
      rewardMultiplier: 20,
      roundCount: 5,
      minimumBet: 10_000,
      betStep: 1_000,
      targetProfit: { mode: 'fixedAmount', amount: 100_000 },
    };
    const request = makeRequest(intent, 10_000_000);

    const result = optimize(request);

    expect(result.kind).toBe('success');
    if (result.kind !== 'success') {
      return;
    }
    expect(result.request.rewardMultiplier).toBe(20);
    expect(result.request.roundCount).toBe(5);
    expect(result.request.targetProfit).toEqual({ mode: 'fixedAmount', amount: 100_000 });
  });

  it('returns failure when bankrollLimit is below required bankroll', () => {
    const request = makeRequest(validCalculationRequest, 1);

    const result = optimize(request);

    expect(result.kind).toBe('failure');
    if (result.kind !== 'failure') {
      return;
    }
    expect(result.code).toBe(OptimizationErrorCodes.NO_FEASIBLE_SOLUTION);
    expect(result.explanation.reason).toBe(OptimizationReasons.NO_FEASIBLE_SOLUTION);
  });

  it('does not return IDENTITY when bankrollLimit is insufficient', () => {
    const request = makeRequest(validCalculationRequest, 1_000);

    const result = optimize(request);

    if (result.kind === 'success') {
      expect(result.explanation.reason).not.toBe(OptimizationReasons.IDENTITY);
    } else {
      expect(result.explanation.reason).not.toBe(OptimizationReasons.IDENTITY);
    }
  });

  it('composes public API only — single pipeline pass on identity path', () => {
    const validateSpy = vi.spyOn(publicApi, 'validateCalculationRequest');
    const solveSpy = vi.spyOn(publicApi, 'solve');
    const buildStrategySpy = vi.spyOn(publicApi, 'buildStrategy');
    const buildStatisticsSpy = vi.spyOn(publicApi, 'buildStatistics');

    const request = makeRequest(validCalculationRequest, 10_000_000);
    optimize(request);

    expect(validateSpy).toHaveBeenCalledTimes(1);
    expect(solveSpy).toHaveBeenCalledTimes(1);
    expect(buildStrategySpy).toHaveBeenCalledTimes(1);
    expect(buildStatisticsSpy).toHaveBeenCalledTimes(1);

    validateSpy.mockRestore();
    solveSpy.mockRestore();
    buildStrategySpy.mockRestore();
    buildStatisticsSpy.mockRestore();
  });

  it('returns failure without ValidationCodes in result', () => {
    const invalidIntent: CalculationRequest = {
      ...validCalculationRequest,
      roundCount: 0,
    };
    const request = makeRequest(invalidIntent, 10_000_000);

    const result = optimize(request);

    expect(result.kind).toBe('failure');
    if (result.kind !== 'failure') {
      return;
    }
    expect(result.code).toBe(OptimizationErrorCodes.NO_FEASIBLE_SOLUTION);
    expect(JSON.stringify(result)).not.toMatch(/VALIDATION_/);
  });
});
