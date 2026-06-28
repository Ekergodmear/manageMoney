/**
 * Phase 1 — structural validation rules.
 */

import type { CalculationRequest } from '@/application/dto';
import { hasAtMostTwoDecimalPlaces } from '@/core/monetary/reward-multiplier-encoding';

import {
  getTargetProfitMode,
  isKnownTargetProfitMode,
  isRequestObject,
} from '../helpers/target-profit-mode';
import { ValidationCodes } from '../error-codes';
import type { ValidationPhase } from '../types';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function whenRequestValid(
  request: CalculationRequest,
  check: (valid: CalculationRequest) => boolean,
): boolean {
  if (!isRequestObject(request)) {
    return true;
  }
  return check(request);
}

function hasValidTargetProfitMode(request: CalculationRequest): boolean {
  return isKnownTargetProfitMode(getTargetProfitMode(request));
}

export const structuralRules: ValidationPhase = [
  {
    code: ValidationCodes.S001_REQUEST_INVALID,
    path: 'request',
    layer: 'structural',
    message: 'Request must be a non-null object',
    isValid: isRequestObject,
  },
  {
    code: ValidationCodes.S002_REWARD_MULTIPLIER_NAN,
    path: 'rewardMultiplier',
    layer: 'structural',
    message: 'rewardMultiplier must be a finite number',
    isValid: (request) => whenRequestValid(request, (r) => isFiniteNumber(r.rewardMultiplier)),
  },
  {
    code: ValidationCodes.S013_REWARD_MULTIPLIER_PRECISION,
    path: 'rewardMultiplier',
    layer: 'structural',
    message: 'rewardMultiplier must have at most 2 decimal places',
    isValid: (request) =>
      whenRequestValid(
        request,
        (r) => isFiniteNumber(r.rewardMultiplier) && hasAtMostTwoDecimalPlaces(r.rewardMultiplier),
      ),
  },
  {
    code: ValidationCodes.S003_ROUND_COUNT_NAN,
    path: 'roundCount',
    layer: 'structural',
    message: 'roundCount must be a finite number',
    isValid: (request) => whenRequestValid(request, (r) => isFiniteNumber(r.roundCount)),
  },
  {
    code: ValidationCodes.S004_MINIMUM_BET_NAN,
    path: 'minimumBet',
    layer: 'structural',
    message: 'minimumBet must be a finite number',
    isValid: (request) => whenRequestValid(request, (r) => isFiniteNumber(r.minimumBet)),
  },
  {
    code: ValidationCodes.S005_BET_STEP_NAN,
    path: 'betStep',
    layer: 'structural',
    message: 'betStep must be a finite number',
    isValid: (request) => whenRequestValid(request, (r) => isFiniteNumber(r.betStep)),
  },
  {
    code: ValidationCodes.S006_TARGET_PROFIT_INVALID,
    path: 'targetProfit',
    layer: 'structural',
    message: 'targetProfit.mode must be breakEven, fixedAmount, or percentage',
    isValid: hasValidTargetProfitMode,
  },
  {
    code: ValidationCodes.S007_ROUND_COUNT_NOT_INTEGER,
    path: 'roundCount',
    layer: 'structural',
    message: 'roundCount must be an integer',
    isValid: (request) => whenRequestValid(request, (r) => Number.isInteger(r.roundCount)),
  },
  {
    code: ValidationCodes.S008_MINIMUM_BET_NOT_INTEGER,
    path: 'minimumBet',
    layer: 'structural',
    message: 'minimumBet must be an integer',
    isValid: (request) => whenRequestValid(request, (r) => Number.isInteger(r.minimumBet)),
  },
  {
    code: ValidationCodes.S009_BET_STEP_NOT_INTEGER,
    path: 'betStep',
    layer: 'structural',
    message: 'betStep must be an integer',
    isValid: (request) => whenRequestValid(request, (r) => Number.isInteger(r.betStep)),
  },
  {
    code: ValidationCodes.S010_FIXED_AMOUNT_NAN,
    path: 'targetProfit.amount',
    layer: 'structural',
    message: 'targetProfit.amount must be a finite number',
    isValid: (request) =>
      whenRequestValid(request, (r) => {
        if (getTargetProfitMode(r) !== 'fixedAmount' || r.targetProfit.mode !== 'fixedAmount') {
          return true;
        }
        return isFiniteNumber(r.targetProfit.amount);
      }),
  },
  {
    code: ValidationCodes.S011_FIXED_AMOUNT_NOT_INTEGER,
    path: 'targetProfit.amount',
    layer: 'structural',
    message: 'targetProfit.amount must be an integer',
    isValid: (request) =>
      whenRequestValid(request, (r) => {
        if (getTargetProfitMode(r) !== 'fixedAmount' || r.targetProfit.mode !== 'fixedAmount') {
          return true;
        }
        return Number.isInteger(r.targetProfit.amount);
      }),
  },
  {
    code: ValidationCodes.S012_PERCENTAGE_NAN,
    path: 'targetProfit.percentage',
    layer: 'structural',
    message: 'targetProfit.percentage must be a finite number',
    isValid: (request) =>
      whenRequestValid(request, (r) => {
        if (getTargetProfitMode(r) !== 'percentage' || r.targetProfit.mode !== 'percentage') {
          return true;
        }
        return isFiniteNumber(r.targetProfit.percentage);
      }),
  },
  {
    code: ValidationCodes.S014_WIN_TAX_THRESHOLD_INVALID,
    path: 'winTax.threshold',
    layer: 'structural',
    message: 'winTax.threshold must be a finite integer',
    isValid: (request) =>
      whenRequestValid(request, (r) => {
        if (r.winTax === undefined) {
          return true;
        }
        return (
          typeof r.winTax === 'object' &&
          r.winTax !== null &&
          isFiniteNumber(r.winTax.threshold) &&
          Number.isInteger(r.winTax.threshold)
        );
      }),
  },
  {
    code: ValidationCodes.S015_WIN_TAX_RATE_INVALID,
    path: 'winTax.ratePercent',
    layer: 'structural',
    message: 'winTax.ratePercent must be a finite integer',
    isValid: (request) =>
      whenRequestValid(request, (r) => {
        if (r.winTax === undefined) {
          return true;
        }
        return (
          typeof r.winTax === 'object' &&
          r.winTax !== null &&
          isFiniteNumber(r.winTax.ratePercent) &&
          Number.isInteger(r.winTax.ratePercent)
        );
      }),
  },
];
