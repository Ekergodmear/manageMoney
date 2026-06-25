/**
 * Deterministic scenario outcome — self-contained aggregate.
 * @see docs/design/simulation-engine-spec.md
 */

import type { BankrollAmount, ProfitAmount } from './amounts';
import type { RoundSimulation } from './round-simulation';

export interface SimulationResult {
  /** Winning round of this scenario (1-based). Self-contained for serialization. */
  readonly winningRoundIndex: number;
  /** Terminal profit if win occurs at winningRoundIndex — scenario profit, not strategy cumulative. */
  readonly profitAmount: ProfitAmount;
  readonly requiredBankrollAmount: BankrollAmount;
  readonly rounds: readonly RoundSimulation[];
}
