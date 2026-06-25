/**
 * Pure candidate constructor — shapes CalculationRequest for profit search.
 * No validation, no policy, no engine imports.
 */

import type { CalculationRequest } from '@/application/dto';
import type { ProfitAmount } from '@/core/models';

export function createProfitCandidate(
  intent: CalculationRequest,
  profit: ProfitAmount,
): CalculationRequest {
  return {
    ...intent,
    targetProfit: { mode: 'fixedAmount', amount: profit },
  };
}
