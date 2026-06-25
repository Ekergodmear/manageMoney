import type { ScenarioName } from '../scenarios';

export type CapabilityName =
  | 'validateCalculationRequest'
  | 'solve'
  | 'buildStrategy'
  | 'buildStatistics'
  | 'simulateWinAtRound'
  | 'pipeline';

export interface LatencyRecord {
  readonly capability: CapabilityName;
  readonly scenario: ScenarioName;
  readonly roundCount: number;
  readonly iterations: number;
  readonly latencyUsPerOp: number;
  readonly unit: 'µs/op';
}

/** schemaVersion 2 — flat metadata + nested results (Sprint 2.7C.2 sign-off). */
export interface BaselineArtifact {
  readonly schemaVersion: 2;
  readonly sdkVersion: string;
  readonly benchmarkRunnerVersion: string;
  readonly gitCommitSha: string | null;
  readonly measuredAt: string;
  readonly label: string;
  readonly nodeVersion: string;
  readonly platform: string;
  readonly arch: string;
  readonly cpu: string;
  readonly profiles: readonly ScenarioName[];
  readonly results: {
    readonly latency: readonly LatencyRecord[];
  };
  readonly notes: readonly string[];
}
