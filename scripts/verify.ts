import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { formatBytes, measureBundleSize } from './lib/bundle-size.js';
import {
  runBuildApp,
  runBuildLib,
  runLint,
  runTypecheck,
  runVitest,
} from './lib/exec.js';
import { readGitBranch, readGitCommitSha } from './lib/git.js';
import type { VerifyReport, VerifyStepReport } from './lib/report-types.js';
import { stepFromResult, writeVerifyArtifacts } from './report.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export interface VerifyOptions {
  readonly writeReports?: boolean;
}

export async function runVerify(options: VerifyOptions = {}): Promise<VerifyReport> {
  const writeReports = options.writeReports !== false;
  const started = Date.now();
  const warnings: string[] = [];
  const steps: VerifyStepReport[] = [];

  const date = new Date().toISOString();
  const commit = readGitCommitSha();
  const branch = readGitBranch();

  const failFast = (): VerifyReport => {
    const report = buildReport(date, commit, branch, started, warnings, steps);
    if (writeReports) {
      writeVerifyArtifacts(report);
    }
    return report;
  };

  const typecheck = runTypecheck();
  const typeStep = stepFromResult('typecheck', 'Typecheck', typecheck.ok, typecheck.durationMs, {
    ...(typecheck.errorSummary !== undefined ? { error: typecheck.errorSummary } : {}),
  });
  steps.push(typeStep);
  if (!typecheck.ok) {
    return failFast();
  }

  const lint = runLint();
  const lintStep = stepFromResult('lint', 'Lint', lint.ok, lint.durationMs, {
    ...(lint.errorSummary !== undefined ? { error: lint.errorSummary } : {}),
  });
  steps.push(lintStep);
  if (!lint.ok) {
    return failFast();
  }

  const unit = runVitest(['tests/unit'], [
    'tests/unit/game-data/**',
    'tests/unit/notifications/**',
  ]);
  const unitStep = stepFromResult('unit', 'Unit Tests', unit.ok, unit.durationMs, {
    ...(unit.passed !== undefined ? { passed: unit.passed } : {}),
    ...(unit.total !== undefined ? { total: unit.total } : {}),
    ...(unit.errorSummary !== undefined ? { error: unit.errorSummary } : {}),
  });
  steps.push(unitStep);
  if (!unit.ok) {
    return failFast();
  }

  const architecture = runVitest(['tests/architecture']);
  const archStep = stepFromResult('architecture', 'Architecture', architecture.ok, architecture.durationMs, {
    ...(architecture.passed !== undefined ? { passed: architecture.passed } : {}),
    ...(architecture.total !== undefined ? { total: architecture.total } : {}),
    ...(architecture.errorSummary !== undefined ? { error: architecture.errorSummary } : {}),
  });
  steps.push(archStep);
  if (!architecture.ok) {
    return failFast();
  }

  const gameData = runVitest(['tests/unit/game-data']);
  const gameDataStep = stepFromResult('gameData', 'Game Data', gameData.ok, gameData.durationMs, {
    ...(gameData.passed !== undefined ? { passed: gameData.passed } : {}),
    ...(gameData.total !== undefined ? { total: gameData.total } : {}),
    ...(gameData.errorSummary !== undefined ? { error: gameData.errorSummary } : {}),
  });
  steps.push(gameDataStep);
  if (!gameData.ok) {
    return failFast();
  }

  const notifications = runVitest(['tests/unit/notifications']);
  const notifStep = stepFromResult(
    'notifications',
    'Notifications',
    notifications.ok,
    notifications.durationMs,
    {
      ...(notifications.passed !== undefined ? { passed: notifications.passed } : {}),
      ...(notifications.total !== undefined ? { total: notifications.total } : {}),
      ...(notifications.errorSummary !== undefined ? { error: notifications.errorSummary } : {}),
    },
  );
  steps.push(notifStep);
  if (!notifications.ok) {
    return failFast();
  }

  const buildStarted = Date.now();
  const buildLib = runBuildLib();
  if (!buildLib.ok) {
    const buildStep = stepFromResult('build', 'Build', false, buildLib.durationMs, {
      ...(buildLib.errorSummary !== undefined ? { error: buildLib.errorSummary } : {}),
    });
    steps.push(buildStep);
    return failFast();
  }

  const buildApp = runBuildApp();
  const buildTimeMs = Date.now() - buildStarted;
  const bundle = measureBundleSize([
    join(ROOT, 'dist'),
    join(ROOT, 'dist-app'),
  ]);
  const buildStep = stepFromResult('build', 'Build', buildApp.ok, buildApp.durationMs, {
    detail: `Build time: ${(buildTimeMs / 1000).toFixed(1)}s\nBundle size: ${formatBytes(bundle.bytes)} (${bundle.files} files)`,
    ...(buildApp.errorSummary !== undefined ? { error: buildApp.errorSummary } : {}),
  });
  steps.push(buildStep);
  if (!buildApp.ok) {
    return failFast();
  }

  const report = buildReport(date, commit, branch, started, warnings, steps, {
    buildTimeMs,
    bundleBytes: bundle.bytes,
    bundleFiles: bundle.files,
  });

  if (writeReports) {
    const paths = writeVerifyArtifacts(report);
    console.log(`Verify report → ${paths.markdownPath}`);
    console.log(`Latest JSON → ${paths.latestJsonPath}`);
    console.log(`Trend JSON → ${paths.trendJsonPath}`);
  }

  return report;
}

function buildReport(
  date: string,
  commit: string,
  branch: string,
  started: number,
  warnings: readonly string[],
  steps: readonly VerifyStepReport[],
  build?: { buildTimeMs: number; bundleBytes: number; bundleFiles: number },
): VerifyReport {
  const status = steps.every((s) => s.status === 'PASS') ? 'PASS' : 'FAIL';
  return {
    date,
    commit,
    branch,
    status,
    durationMs: Date.now() - started,
    warnings,
    steps,
    ...(build !== undefined
      ? {
          buildTimeMs: build.buildTimeMs,
          bundleBytes: build.bundleBytes,
          bundleFiles: build.bundleFiles,
        }
      : {}),
  };
}

async function main(): Promise<void> {
  console.log('Stake Planner verify');
  const report = await runVerify();
  console.log(`\nSummary: ${report.status} (${(report.durationMs / 1000).toFixed(1)}s)`);
  process.exit(report.status === 'PASS' ? 0 : 1);
}

void main();
