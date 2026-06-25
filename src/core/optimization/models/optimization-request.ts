/**
 * Optimization input — intent, constraints, policy only (RFC-005).
 * No derived search boundaries.
 * @see docs/rfc/optimization/RFC-005-request.md
 */

import type { CalculationRequest } from '@/application/dto';
import type { BankrollAmount, ProfitAmount } from '@/core/models';

export interface OptimizationRequest {
  readonly intent: CalculationRequest;
  readonly bankrollLimit: BankrollAmount;
  readonly allowRoundReduction: boolean;
  readonly profitGranularity: ProfitAmount;
}
