/**
 * Public API wiring — re-exports from internal modules.
 * Review contract changes in `index.ts`, not here.
 * @see PUBLIC_API.md
 */

import { ValidationCodes as internalValidationCodes } from '@/core/validation';

export { validateCalculationRequest } from '@/core/validation';
export { solve } from '@/core/solver';
export { buildStrategy } from '@/core/strategy-builder';
export { buildStatistics } from '@/core/statistics-builder';
export { simulateWinAtRound } from '@/core/simulation';

/**
 * Stable Constant Registry — frozen at the public boundary.
 * Constant names and values are SemVer-stable (ADR-026).
 */
export const ValidationCodes: typeof internalValidationCodes = Object.freeze({
  ...internalValidationCodes,
});

export type { SolverError } from '@/core/solver';
export type { SimulationError } from '@/core/simulation';

export type {
  CalculationRequest,
  ValidatedCalculationRequest,
  TargetProfit,
  RewardMultiplier,
  RoundCount,
  MinimumBet,
  BetStep,
  WinTax,
} from '@/application/dto';

export type {
  Strategy,
  Round,
  StrategyStatistics,
  SimulationResult,
  RoundSimulation,
  RoundResult,
  BetAmount,
  RewardAmount,
  ProfitAmount,
  BankrollAmount,
} from '@/core/models';

export type {
  Result,
  Success,
  Failure,
  ValidationResult,
  ValidationError,
  ValidationLayer,
} from '@/core/contracts';
