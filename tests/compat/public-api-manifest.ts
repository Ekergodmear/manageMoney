/**
 * Frozen public API manifest — compat tests enforce this list.
 * @see PUBLIC_API.md
 */

export const PUBLIC_RUNTIME_EXPORTS = [
  'OptimizationReasons',
  'ValidationCodes',
  'buildStatistics',
  'buildStrategy',
  'optimize',
  'simulateWinAtRound',
  'solve',
  'validateCalculationRequest',
] as const;

export const PUBLIC_TYPE_EXPORTS = [
  'BankrollAmount',
  'BetAmount',
  'BetStep',
  'CalculationRequest',
  'Failure',
  'MinimumBet',
  'OptimizationErrorCode',
  'OptimizationExplanation',
  'OptimizationFailure',
  'OptimizationReason',
  'OptimizationRequest',
  'OptimizationResult',
  'OptimizationSuccess',
  'ProfitAmount',
  'Result',
  'RewardAmount',
  'RewardMultiplier',
  'Round',
  'RoundCount',
  'RoundResult',
  'RoundSimulation',
  'SimulationError',
  'SimulationResult',
  'SolverError',
  'Strategy',
  'StrategyStatistics',
  'Success',
  'TargetProfit',
  'ValidatedCalculationRequest',
  'ValidationError',
  'ValidationLayer',
  'ValidationResult',
  'WinTax',
] as const;
