/**
 * Per-capability latency benchmarks — public API only.
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

export function runPublicApiBenchmarks(): LatencyRecord[] {
  const prepared = prepareScenarios();
  const records: LatencyRecord[] = [];

  for (const scenario of prepared) {
    const profile = ITERATION_PROFILE[scenario.name];

    records.push({
      capability: 'validateCalculationRequest',
      scenario: scenario.name,
      roundCount: scenario.roundCount,
      iterations: profile.iterations,
      latencyUsPerOp: measureLatency(() => {
        validateCalculationRequest(scenario.request);
      }, profile),
      unit: 'µs/op',
    });

    records.push({
      capability: 'solve',
      scenario: scenario.name,
      roundCount: scenario.roundCount,
      iterations: profile.iterations,
      latencyUsPerOp: measureLatency(() => {
        solve(scenario.validated);
      }, profile),
      unit: 'µs/op',
    });

    records.push({
      capability: 'buildStrategy',
      scenario: scenario.name,
      roundCount: scenario.roundCount,
      iterations: profile.iterations,
      latencyUsPerOp: measureLatency(() => {
        buildStrategy(scenario.strategy.rounds);
      }, profile),
      unit: 'µs/op',
    });

    records.push({
      capability: 'buildStatistics',
      scenario: scenario.name,
      roundCount: scenario.roundCount,
      iterations: profile.iterations,
      latencyUsPerOp: measureLatency(() => {
        buildStatistics(scenario.strategy);
      }, profile),
      unit: 'µs/op',
    });

    records.push({
      capability: 'simulateWinAtRound',
      scenario: scenario.name,
      roundCount: scenario.roundCount,
      iterations: profile.iterations,
      latencyUsPerOp: measureLatency(() => {
        simulateWinAtRound(scenario.strategy, scenario.winAtRound);
      }, profile),
      unit: 'µs/op',
    });
  }

  return records;
}
