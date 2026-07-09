/**
 * Search step policy — RFC-004 step rules only (Sprint 3.2A).
 * Not a plugin point: one v1 implementation (`defaultSearchPolicy`).
 * @see docs/design/sprint-3.2-spec.md
 */

import type { CalculationRequest, RoundCount } from '@/application/dto';
import type { ProfitAmount } from '@/core/models';

/**
 * Pure policy object: proposes next candidate scalar values.
 * Does not evaluate feasibility or import Core SDK capabilities.
 */
export interface SearchPolicy {
  /**
   * Next lower profit amount at fixed round count.
   * Returns `null` when profit search is exhausted (at 0).
   */
  nextProfit(
    intent: CalculationRequest,
    currentProfit: ProfitAmount,
    profitGranularity: ProfitAmount,
  ): ProfitAmount | null;

  /**
   * Next lower round count.
   * Returns `null` when at minimum (1 round).
   */
  nextRoundCount(intent: CalculationRequest, currentRoundCount: RoundCount): RoundCount | null;
}
