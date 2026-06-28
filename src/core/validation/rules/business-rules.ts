/**
 * Phase 2 — business validation rules.
 */

import { getTargetProfitMode } from '../helpers/target-profit-mode';
import { ValidationCodes } from '../error-codes';
import type { ValidationPhase } from '../types';

const MAX_PERCENTAGE = 1000;

export const businessRules: ValidationPhase = [
  {
    code: ValidationCodes.B001_REWARD_MULTIPLIER_TOO_LOW,
    path: 'rewardMultiplier',
    layer: 'business',
    message: 'rewardMultiplier must be greater than 1',
    isValid: (request) => request.rewardMultiplier > 1,
  },
  {
    code: ValidationCodes.B002_ROUND_COUNT_TOO_LOW,
    path: 'roundCount',
    layer: 'business',
    message: 'roundCount must be at least 1',
    isValid: (request) => request.roundCount >= 1,
  },
  {
    code: ValidationCodes.B003_MINIMUM_BET_TOO_LOW,
    path: 'minimumBet',
    layer: 'business',
    message: 'minimumBet must be greater than 0',
    isValid: (request) => request.minimumBet > 0,
  },
  {
    code: ValidationCodes.B004_BET_STEP_TOO_LOW,
    path: 'betStep',
    layer: 'business',
    message: 'betStep must be greater than 0',
    isValid: (request) => request.betStep > 0,
  },
  {
    code: ValidationCodes.B005_MINIMUM_BET_STEP_MISMATCH,
    path: 'minimumBet',
    layer: 'business',
    message: 'minimumBet must be a multiple of betStep',
    isValid: (request) => request.minimumBet % request.betStep === 0,
  },
  {
    code: ValidationCodes.B006_FIXED_AMOUNT_NEGATIVE,
    path: 'targetProfit.amount',
    layer: 'business',
    message: 'targetProfit.amount must be non-negative',
    isValid: (request) => {
      if (
        getTargetProfitMode(request) !== 'fixedAmount' ||
        request.targetProfit.mode !== 'fixedAmount'
      ) {
        return true;
      }
      return request.targetProfit.amount >= 0;
    },
  },
  {
    code: ValidationCodes.B007_PERCENTAGE_NEGATIVE,
    path: 'targetProfit.percentage',
    layer: 'business',
    message: 'targetProfit.percentage must be non-negative',
    isValid: (request) => {
      if (
        getTargetProfitMode(request) !== 'percentage' ||
        request.targetProfit.mode !== 'percentage'
      ) {
        return true;
      }
      return request.targetProfit.percentage >= 0;
    },
  },
  {
    code: ValidationCodes.B008_PERCENTAGE_TOO_HIGH,
    path: 'targetProfit.percentage',
    layer: 'business',
    message: `targetProfit.percentage must not exceed ${String(MAX_PERCENTAGE)}`,
    isValid: (request) => {
      if (
        getTargetProfitMode(request) !== 'percentage' ||
        request.targetProfit.mode !== 'percentage'
      ) {
        return true;
      }
      return request.targetProfit.percentage <= MAX_PERCENTAGE;
    },
  },
  {
    code: ValidationCodes.B009_WIN_TAX_THRESHOLD_TOO_LOW,
    path: 'winTax.threshold',
    layer: 'business',
    message: 'winTax.threshold must be at least 1',
    isValid: (request) => {
      if (request.winTax === undefined) {
        return true;
      }
      return request.winTax.threshold >= 1;
    },
  },
  {
    code: ValidationCodes.B010_WIN_TAX_RATE_OUT_OF_RANGE,
    path: 'winTax.ratePercent',
    layer: 'business',
    message: 'winTax.ratePercent must be between 1 and 99',
    isValid: (request) => {
      if (request.winTax === undefined) {
        return true;
      }
      return request.winTax.ratePercent >= 1 && request.winTax.ratePercent <= 99;
    },
  },
];
