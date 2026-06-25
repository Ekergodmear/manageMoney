/**
 * End-to-end pipeline benchmark — supplementary, not primary baseline.
 * @see docs/PERFORMANCE-CONTRACT.md
 */

import {
  buildStatistics,
  buildStrategy,
  simulateWinAtRound,
  solve,
  validateCalculationRequest,
} from '@stake/constraint-engine';

import { measureLatency } from './lib/measure';
import { prepareScenarios } from './lib/prepare';
import type { LatencyRecord } from './lib/types';
import { ITERATION_PROFILE } from './scenarios';

export function runPipelineBenchmarks(): LatencyRecord[] {
  const prepared = prepareScenarios();
  const records: LatencyRecord[] = [];

  for (const scenario of prepared) {
    const profile = ITERATION_PROFILE[scenario.name];

    records.push({
      capability: 'pipeline',
      scenario: scenario.name,
      roundCount: scenario.roundCount,
      iterations: profile.iterations,
      latencyUsPerOp: measureLatency(() => {
        const validated = validateCalculationRequest(scenario.request);
        if (validated.kind !== 'success') {
          return;
        }
        const solved = solve(validated.value);
        if (solved.kind !== 'success') {
          return;
        }
        const strategy = buildStrategy(solved.value.rounds);
        buildStatistics(strategy);
        simulateWinAtRound(strategy, scenario.winAtRound);
      }, profile),
      unit: 'µs/op',
    });
  }

  return records;
}
