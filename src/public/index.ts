/**
 * Public API Contract — Core SDK v1 + Optimization (RFC-005)
 *
 * Every change in this file is a public contract change (breaking review candidate).
 * Consumers MUST import only from this entry — no deep imports.
 *
 * @see PUBLIC_API.md
 * @see docs/design/public-api-inventory.md
 */

// --- Core capabilities ---

export {
  validateCalculationRequest,
  solve,
  buildStrategy,
  buildStatistics,
  simulateWinAtRound,
  ValidationCodes,
} from './capabilities';

export type {
  CalculationRequest,
  ValidatedCalculationRequest,
  TargetProfit,
  RewardMultiplier,
  RoundCount,
  MinimumBet,
  BetStep,
  WinTax,
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
  Result,
  Success,
  Failure,
  ValidationResult,
  ValidationError,
  ValidationLayer,
  SimulationError,
  SolverError,
} from './capabilities';

// --- Optimization (RFC-005) ---

export { optimize, OptimizationReasons } from '@/core/optimization';

export type {
  OptimizationRequest,
  OptimizationResult,
  OptimizationSuccess,
  OptimizationFailure,
  OptimizationExplanation,
  OptimizationReason,
  OptimizationErrorCode,
} from '@/core/optimization';
