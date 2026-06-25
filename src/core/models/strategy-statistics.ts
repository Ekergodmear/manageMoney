/**
 * Pre-computed strategy summary for UI and export.
 * @see docs/DOMAIN-LANGUAGE.md
 */

import type { BetAmount, BankrollAmount, ProfitAmount } from './amounts';

export interface StrategyStatistics {
  readonly roundCount: number;
  readonly requiredBankrollAmount: BankrollAmount;
  readonly maximumBetAmount: BetAmount;
  readonly averageBetAmount: BetAmount;
  readonly minimumBetAmount: BetAmount;
  readonly expectedProfitAmount: ProfitAmount;
}
