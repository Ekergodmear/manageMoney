/**
 * Sprint 3.1A — Optimization contract tests (no algorithm).
 */

import { describe, expect, it } from 'vitest';

import type { CalculationRequest } from '@/application/dto';
import {
  OptimizationErrorCodes,
  type OptimizationErrorCode,
} from '@/core/optimization/models/optimization-error';
import {
  OptimizationReasons,
  type OptimizationExplanation,
  type OptimizationReason,
} from '@/core/optimization/models/optimization-explanation';
import type { OptimizationRequest } from '@/core/optimization/models/optimization-request';
import type {
  OptimizationFailure,
  OptimizationResult,
  OptimizationSuccess,
} from '@/core/optimization/models/optimization-result';

const sampleIntent: CalculationRequest = {
  rewardMultiplier: 20,
  roundCount: 5,
  minimumBet: 10_000,
  betStep: 1_000,
  targetProfit: { mode: 'fixedAmount', amount: 100_000 },
};

const sampleRequest: OptimizationRequest = {
  intent: sampleIntent,
  bankrollLimit: 500_000,
  allowRoundReduction: true,
  profitGranularity: 5_000,
};

describe('OptimizationRequest — contract', () => {
  it('carries intent, bankrollLimit, allowRoundReduction, profitGranularity', () => {
    expect(sampleRequest.intent).toBe(sampleIntent);
    expect(sampleRequest.bankrollLimit).toBe(500_000);
    expect(sampleRequest.allowRoundReduction).toBe(true);
    expect(sampleRequest.profitGranularity).toBe(5_000);
  });

  it('does not include search-boundary fields', () => {
    const keys = Object.keys(sampleRequest).sort();
    expect(keys).toEqual(['allowRoundReduction', 'bankrollLimit', 'intent', 'profitGranularity']);
  });
});

describe('OptimizationExplanation — contract', () => {
  it('has reason, profitReducedBy, roundsReducedBy', () => {
    const explanation: OptimizationExplanation = {
      reason: OptimizationReasons.IDENTITY,
      profitReducedBy: 0,
      roundsReducedBy: 0,
    };
    expect(explanation).toEqual({
      reason: 'IDENTITY',
      profitReducedBy: 0,
      roundsReducedBy: 0,
    });
  });
});

describe('OptimizationReasons — stable registry', () => {
  it('is frozen with expected v1 reasons', () => {
    expect(Object.isFrozen(OptimizationReasons)).toBe(true);
    expect(OptimizationReasons).toEqual({
      IDENTITY: 'IDENTITY',
      PROFIT_REDUCED: 'PROFIT_REDUCED',
      ROUNDS_REDUCED: 'ROUNDS_REDUCED',
      PROFIT_AND_ROUNDS_REDUCED: 'PROFIT_AND_ROUNDS_REDUCED',
      NO_FEASIBLE_SOLUTION: 'NO_FEASIBLE_SOLUTION',
    });
  });

  it('assigns every registry value to OptimizationReason', () => {
    const reasons: OptimizationReason[] = Object.values(OptimizationReasons);
    expect(reasons).toHaveLength(5);
  });
});

describe('OptimizationErrorCodes — stable registry', () => {
  it('is frozen with v1 codes only', () => {
    expect(Object.isFrozen(OptimizationErrorCodes)).toBe(true);
    expect(OptimizationErrorCodes).toEqual({
      NO_FEASIBLE_SOLUTION: 'NO_FEASIBLE_SOLUTION',
    });
  });

  it('does not include ValidationCodes', () => {
    const codes: OptimizationErrorCode[] = Object.values(OptimizationErrorCodes);
    expect(codes.every((code) => !code.startsWith('VALIDATION'))).toBe(true);
  });
});

describe('OptimizationResult — discriminated union', () => {
  const success: OptimizationSuccess = {
    kind: 'success',
    request: sampleIntent,
    explanation: {
      reason: OptimizationReasons.IDENTITY,
      profitReducedBy: 0,
      roundsReducedBy: 0,
    },
  };

  const failure: OptimizationFailure = {
    kind: 'failure',
    code: OptimizationErrorCodes.NO_FEASIBLE_SOLUTION,
    explanation: {
      reason: OptimizationReasons.NO_FEASIBLE_SOLUTION,
      profitReducedBy: 0,
      roundsReducedBy: 0,
    },
  };

  it('success branch has kind success, request, explanation', () => {
    expect(success.kind).toBe('success');
    expect(success.request).toBe(sampleIntent);
    expect(success.explanation.reason).toBe('IDENTITY');
  });

  it('failure branch has kind failure, code, explanation', () => {
    expect(failure.kind).toBe('failure');
    expect(failure.code).toBe('NO_FEASIBLE_SOLUTION');
    expect(failure.explanation.reason).toBe('NO_FEASIBLE_SOLUTION');
  });

  it('narrows on kind discriminant', () => {
    const results: OptimizationResult[] = [success, failure];
    const requests = results.flatMap((result) =>
      result.kind === 'success' ? [result.request] : [],
    );
    expect(requests).toEqual([sampleIntent]);
  });
});
