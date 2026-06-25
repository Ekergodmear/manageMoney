/**
 * Pre-compute golden inputs per scenario (outside timed regions).
 */

import type {
  CalculationRequest,
  Strategy,
  ValidatedCalculationRequest,
} from '@stake/constraint-engine';
import { buildStrategy, solve, validateCalculationRequest } from '@stake/constraint-engine';

import type { ScenarioName } from '../scenarios';
import { BENCHMARK_SCENARIOS } from '../scenarios';

export interface PreparedScenario {
  readonly name: ScenarioName;
  readonly roundCount: number;
  readonly request: CalculationRequest;
  readonly validated: ValidatedCalculationRequest;
  readonly strategy: Strategy;
  readonly winAtRound: number;
}

function assertSuccess<T>(result: { kind: string; value?: T }, label: string): T {
  if (result.kind !== 'success' || result.value === undefined) {
    throw new Error(`benchmark setup failed: ${label}`);
  }
  return result.value;
}

export function prepareScenarios(): PreparedScenario[] {
  return BENCHMARK_SCENARIOS.map((scenario) => {
    const validated = assertSuccess(
      validateCalculationRequest(scenario.request),
      `validate ${scenario.name}`,
    );
    const solved = assertSuccess(solve(validated), `solve ${scenario.name}`);
    const strategy = buildStrategy(solved.rounds);
    const winAtRound = Math.max(1, Math.ceil(scenario.roundCount / 2));

    return {
      name: scenario.name,
      roundCount: scenario.roundCount,
      request: scenario.request,
      validated,
      strategy,
      winAtRound,
    };
  });
}
