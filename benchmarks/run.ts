/**
 * Benchmark runner — writes latency artifact, prints summary table.
 *
 * Usage:
 *   pnpm benchmark              → benchmarks/results/latest.json
 *   pnpm benchmark -- --record    → also updates benchmarks/results/baseline.json
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

import { readGitCommitSha } from './lib/git';
import { BENCHMARK_RUNNER_VERSION } from './lib/runner-version';
import type { BaselineArtifact, LatencyRecord } from './lib/types';
import { runPipelineBenchmarks } from './pipeline.bench';
import { runPublicApiBenchmarks } from './public-api.bench';
import { SCENARIO_NAMES } from './scenarios';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RESULTS_DIR = join(ROOT, 'benchmarks', 'results');

function readSdkVersion(): string {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')) as { version: string };
  return pkg.version;
}

function formatTable(records: readonly LatencyRecord[]): string {
  const header = ['Capability', 'Scenario', 'N', 'µs/op'].join('\t');
  const rows = records.map((r) =>
    [r.capability, r.scenario, String(r.roundCount), r.latencyUsPerOp.toFixed(3)].join('\t'),
  );
  return [header, ...rows].join('\n');
}

function buildArtifact(label: string, latency: readonly LatencyRecord[]): BaselineArtifact {
  return {
    schemaVersion: 2,
    sdkVersion: readSdkVersion(),
    benchmarkRunnerVersion: BENCHMARK_RUNNER_VERSION,
    gitCommitSha: readGitCommitSha(),
    measuredAt: new Date().toISOString(),
    label,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cpu: (os.cpus()[0]?.model ?? 'unknown').trim(),
    profiles: SCENARIO_NAMES,
    results: { latency },
    notes: [
      'Latency only — memory profiling deferred.',
      'Public API only — benchmarks do not prove algorithmic correctness.',
      'Absolute µs/op is environment-specific; see benchmarks/BASELINE.md.',
    ],
  };
}

function writeJson(path: string, data: BaselineArtifact): void {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

const recordBaseline = process.argv.includes('--record');
const label = recordBaseline ? 'baseline' : 'latest';

const publicApi = runPublicApiBenchmarks();
const pipeline = runPipelineBenchmarks();
const latency = [...publicApi, ...pipeline];

const artifact = buildArtifact(label, latency);

mkdirSync(RESULTS_DIR, { recursive: true });
writeJson(join(RESULTS_DIR, 'latest.json'), artifact);

if (recordBaseline) {
  writeJson(join(RESULTS_DIR, 'baseline.json'), artifact);
  console.log('Recorded baseline → benchmarks/results/baseline.json');
  console.log('Update benchmarks/BASELINE.md with environment row if this is a reference run.');
}

console.log('\nBenchmark metadata:');
console.log(`  schemaVersion: ${String(artifact.schemaVersion)}`);
console.log(`  sdkVersion: ${artifact.sdkVersion}`);
console.log(`  runner: ${artifact.benchmarkRunnerVersion}`);
console.log(`  commit: ${artifact.gitCommitSha ?? 'n/a'}`);
console.log(`  Node ${artifact.nodeVersion} | ${artifact.platform}/${artifact.arch}`);
console.log(`  CPU: ${artifact.cpu}`);
console.log(`  profiles: ${artifact.profiles.join(', ')}`);
console.log('\nLatency (µs/op):\n');
console.log(formatTable(latency));
