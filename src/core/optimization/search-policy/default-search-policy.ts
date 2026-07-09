/**
 * Default v1 SearchPolicy — RFC-004 monotonic minimal steps.
 * Pure: no state, cache, or Core SDK imports.
 */

import type { CalculationRequest } from '@/application/dto';

import type { SearchPolicy } from './search-policy';

const MIN_ROUND_COUNT = 1;

function isProfitSearchSupported(intent: CalculationRequest): boolean {
  return intent.targetProfit.mode === 'fixedAmount';
}

/**
 * v1 profit stepping: `fixedAmount` only.
 * `breakEven` and `percentage` return `null` (deterministic unsupported).
 */
export const defaultSearchPolicy: SearchPolicy = {
  nextProfit(intent, currentProfit, profitGranularity) {
    if (!isProfitSearchSupported(intent)) {
      return null;
    }

    if (profitGranularity <= 0) {
      return null;
    }

    if (currentProfit <= 0) {
      return null;
    }

    const next = currentProfit - profitGranularity;

    if (next <= 0) {
      return 0;
    }

    return next;
  },

  nextRoundCount(intent, currentRoundCount) {
    if (currentRoundCount > intent.roundCount) {
      return null;
    }

    if (currentRoundCount <= MIN_ROUND_COUNT) {
      return null;
    }

    return currentRoundCount - 1;
  },
};
