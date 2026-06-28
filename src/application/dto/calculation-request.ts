/**
 * Primary input from UI → application orchestration.
 * Data only — no validation logic in DTO layer.
 * @see docs/FLOWS.md — CalculationRequest flow
 */

import type { BetStep, MinimumBet, RewardMultiplier, RoundCount } from './request-types';
import type { TargetProfit } from './target-profit';
import type { WinTax } from './win-tax';

export interface CalculationRequest {
  readonly rewardMultiplier: RewardMultiplier;
  readonly roundCount: RoundCount;
  readonly minimumBet: MinimumBet;
  readonly betStep: BetStep;
  readonly targetProfit: TargetProfit;
  /** When set, net reward applies tier tax on gross win ≥ threshold. */
  readonly winTax?: WinTax;
}
