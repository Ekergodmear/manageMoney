/**
 * Fixed golden benchmark scenarios — no random input.
 * @see docs/PERFORMANCE-CONTRACT.md
 */

import type { CalculationRequest } from '@stake/constraint-engine';

export const SCENARIO_NAMES = ['small', 'medium', 'large', 'stress'] as const;

export type ScenarioName = (typeof SCENARIO_NAMES)[number];

export interface BenchmarkScenario {
  readonly name: ScenarioName;
  readonly roundCount: number;
  readonly request: CalculationRequest;
}

const GOLDEN_PARAMS = {
  rewardMultiplier: 20,
  minimumBet: 10_000,
  betStep: 1_000,
  targetProfit: { mode: 'fixedAmount' as const, amount: 100_000 },
};

const ROUND_COUNTS: Record<ScenarioName, number> = {
  small: 5,
  medium: 50,
  large: 500,
  stress: 5_000,
};

export function buildGoldenRequest(roundCount: number): CalculationRequest {
  return {
    ...GOLDEN_PARAMS,
    roundCount,
  };
}

export const BENCHMARK_SCENARIOS: readonly BenchmarkScenario[] = SCENARIO_NAMES.map((name) => {
  const roundCount = ROUND_COUNTS[name];
  return {
    name,
    roundCount,
    request: buildGoldenRequest(roundCount),
  };
});

/** Iteration counts scale inversely with N — stress uses fewer reps. */
export const ITERATION_PROFILE: Record<
  ScenarioName,
  { readonly warmup: number; readonly iterations: number }
> = {
  small: { warmup: 500, iterations: 50_000 },
  medium: { warmup: 200, iterations: 5_000 },
  large: { warmup: 50, iterations: 500 },
  stress: { warmup: 10, iterations: 50 },
};
