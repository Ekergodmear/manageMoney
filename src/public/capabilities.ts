/**
 * Core SDK capabilities — no Optimization export (breaks circular import with optimize.ts).
 * @see src/public/index.ts
 */

export {
  validateCalculationRequest,
  solve,
  buildStrategy,
  buildStatistics,
  simulateWinAtRound,
  ValidationCodes,
} from './exports';

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
} from './exports';
