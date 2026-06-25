/**
 * Structured explanation contract — UI maps reason to i18n (RFC-005).
 * @see docs/rfc/optimization/RFC-005-request.md
 */

import type { ProfitAmount } from '@/core/models';

export const OptimizationReasons = Object.freeze({
  IDENTITY: 'IDENTITY',
  PROFIT_REDUCED: 'PROFIT_REDUCED',
  ROUNDS_REDUCED: 'ROUNDS_REDUCED',
  PROFIT_AND_ROUNDS_REDUCED: 'PROFIT_AND_ROUNDS_REDUCED',
  NO_FEASIBLE_SOLUTION: 'NO_FEASIBLE_SOLUTION',
} as const);

export type OptimizationReason = (typeof OptimizationReasons)[keyof typeof OptimizationReasons];

export interface OptimizationExplanation {
  readonly reason: OptimizationReason;
  readonly profitReducedBy: ProfitAmount;
  readonly roundsReducedBy: number;
}
