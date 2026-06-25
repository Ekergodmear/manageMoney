/**
 * Public API Contract — Core SDK v1
 *
 * Every change in this file is a public contract change (breaking review candidate).
 * Consumers MUST import only from this entry — no deep imports.
 *
 * @see PUBLIC_API.md
 * @see docs/design/public-api-inventory.md
 */

// --- Capabilities (use cases) ---

export {
  validateCalculationRequest,
  solve,
  buildStrategy,
  buildStatistics,
  simulateWinAtRound,
  ValidationCodes,
} from './exports';

// --- Input DTOs ---

export type {
  CalculationRequest,
  ValidatedCalculationRequest,
  TargetProfit,
  RewardMultiplier,
  RoundCount,
  MinimumBet,
  BetStep,
} from './exports';

// --- Domain models ---

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
} from './exports';

// --- Result & errors ---

export type {
  Result,
  Success,
  Failure,
  ValidationResult,
  ValidationError,
  ValidationLayer,
  SimulationError,
  SolverError,
} from './exports';
