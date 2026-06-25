/**
 * Projection of a Round for scenario trace — not a full Round copy.
 * @see docs/design/simulation-engine-spec.md
 */

import type { BetAmount, BankrollAmount } from './amounts';
import type { RoundResult } from './round-result';

export interface RoundSimulation {
  readonly index: number;
  readonly result: RoundResult;
  readonly betAmount: BetAmount;
  readonly accumulatedSpent: BankrollAmount;
}
