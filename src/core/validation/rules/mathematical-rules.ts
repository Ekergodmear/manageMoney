/**
 * Phase 3 — mathematical validation rules.
 */

import type { CalculationRequest } from '@/application/dto';

import { ValidationCodes } from '../error-codes';
import type { ValidationPhase } from '../types';

const MAX_SAFE = Number.MAX_SAFE_INTEGER;

function fieldWithinSafeInteger(request: CalculationRequest): boolean {
  const fields = [
    request.rewardMultiplier,
    request.roundCount,
    request.minimumBet,
    request.betStep,
  ];

  for (const value of fields) {
    if (value > MAX_SAFE || value < -MAX_SAFE) {
      return false;
    }
  }

  if (request.targetProfit.mode === 'fixedAmount') {
    const amount = request.targetProfit.amount;
    if (amount > MAX_SAFE || amount < -MAX_SAFE) {
      return false;
    }
  }

  if (request.targetProfit.mode === 'percentage') {
    const percentage = request.targetProfit.percentage;
    if (percentage > MAX_SAFE || percentage < -MAX_SAFE) {
      return false;
    }
  }

  return true;
}

function solverOverflowRisk(request: CalculationRequest): boolean {
  if (request.roundCount > MAX_SAFE || request.minimumBet > MAX_SAFE) {
    return false;
  }

  const bankrollBound = request.roundCount * request.minimumBet;
  if (bankrollBound > MAX_SAFE) {
    return false;
  }

  const rewardBound = request.minimumBet * request.rewardMultiplier;
  return rewardBound <= MAX_SAFE;
}

export const mathematicalRules: ValidationPhase = [
  {
    code: ValidationCodes.M001_FIELD_OVERFLOW,
    path: 'request',
    layer: 'mathematical',
    message: 'Request values must stay within Number.MAX_SAFE_INTEGER',
    isValid: fieldWithinSafeInteger,
  },
  {
    code: ValidationCodes.M002_SOLVER_OVERFLOW_RISK,
    path: 'request',
    layer: 'mathematical',
    message: 'Request may cause integer overflow during solver execution',
    isValid: solverOverflowRisk,
  },
];
