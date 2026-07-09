import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { formatBytes, measureBundleSize } from './lib/bundle-size.js';
import { parseEslintJson, runLintJson } from './lib/eslint.js';
import { runBuildApp, runBuildLib, runBenchmark, runLint, runTypecheck, runUnitTestsBatched, runVitest } from './lib/exec.js';
import { readGitBranch, readGitCommitSha } from './lib/git.js';
import type { VerifyReport, VerifyStepReport } from './lib/report-types.js';
import {
  computeQualityScore,
  computeVerifyOutcome,
  stepFromResult,
  totalStepWarnings,
  writeVerifyArtifacts,
} from './report.js';
import { generateSoakReport } from './soak-report.js';
import {
  ARCHITECTURE_TEST_PATHS,
  PROPERTY_TEST_PATHS,
  SMOKE_TEST_PATHS,
  type VerifyProfile,
} from './lib/test-suites.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export interface VerifyOptions {
  readonly writeReports?: boolean;
  readonly profile?: VerifyProfile;
  readonly includeProperty?: boolean;
  readonly includeSoak?: boolean;
  readonly includePerformance?: boolean;
}

export async function runVerify(options: VerifyOptions = {}): Promise<VerifyReport> {
  const profile = options.profile ?? 'rc';
  const writeReports = options.writeReports !== false;
  const includeProperty = options.includeProperty ?? profile === 'nightly';
  const includeSoak = options.includeSoak ?? profile === 'nightly';
  const includePerformance = options.includePerformance ?? profile === 'nightly';
  const propertyProfile = profile === 'nightly' ? 'nightly' : 'rc';

  const started = Date.now();
  const warnings: string[] = [];
  const steps: VerifyStepReport[] = [];

  const date = new Date().toISOString();
  const commit = readGitCommitSha();
  const branch = readGitBranch();

  const typecheck = runTypecheck();
  console.log(`Typecheck ${typecheck.ok ? 'PASS' : 'FAIL'} (${(typecheck.durationMs / 1000).toFixed(1)}s)`);
  steps.push(
    stepFromResult('typecheck', 'Typecheck', typecheck.ok, typecheck.durationMs, {
      ...(typecheck.errorSummary !== undefined ? { error: typecheck.errorSummary } : {}),
    }),
  );

  const lint = runLint();
  console.log(`Lint ${lint.ok ? 'PASS' : 'FAIL'} (${(lint.durationMs / 1000).toFixed(1)}s)`);
  let lintErrorCount = 0;
  if (!lint.ok) {
    const jsonPath = join(ROOT, 'reports', 'eslint.json');
    runLintJson(jsonPath);
    lintErrorCount = parseEslintJson(jsonPath).length;
  }
  steps.push(
    stepFromResult('lint', 'Lint', lint.ok, lint.durationMs, {
      ...(lintErrorCount > 0 ? { detail: `${lintErrorCount} ESLint issue(s)` } : {}),
      ...(lint.errorSummary !== undefined ? { error: lint.errorSummary } : {}),
    }),
  );

  const unit = runUnitTestsBatched();
  console.log(`Unit ${unit.ok ? 'PASS' : 'FAIL'} (${(unit.durationMs / 1000).toFixed(1)}s)`);
  steps.push(
    stepFromResult('unit', 'Unit Tests', unit.ok, unit.durationMs, {
      ...(unit.errorSummary !== undefined ? { error: unit.errorSummary } : {}),
    }),
  );

  const architecture = runVitest([...ARCHITECTURE_TEST_PATHS]);
  console.log(`Architecture ${architecture.ok ? 'PASS' : 'FAIL'} (${(architecture.durationMs / 1000).toFixed(1)}s)`);
  steps.push(
    stepFromResult('architecture', 'Architecture', architecture.ok, architecture.durationMs, {
      ...(architecture.passed !== undefined ? { passed: architecture.passed } : {}),
      ...(architecture.total !== undefined ? { total: architecture.total } : {}),
      ...(architecture.passed !== undefined && architecture.total !== undefined
        ? { failed: architecture.total - architecture.passed }
        : {}),
      ...(architecture.errorSummary !== undefined ? { error: architecture.errorSummary } : {}),
    }),
  );

  const gameData = runVitest(['tests/unit/game-data']);
  console.log(`Game Data ${gameData.ok ? 'PASS' : 'FAIL'} (${(gameData.durationMs / 1000).toFixed(1)}s)`);
  steps.push(
    stepFromResult('gameData', 'Game Data', gameData.ok, gameData.durationMs, {
      ...(gameData.passed !== undefined ? { passed: gameData.passed } : {}),
      ...(gameData.total !== undefined ? { total: gameData.total } : {}),
      ...(gameData.passed !== undefined && gameData.total !== undefined
        ? { failed: gameData.total - gameData.passed }
        : {}),
      ...(gameData.errorSummary !== undefined ? { error: gameData.errorSummary } : {}),
    }),
  );

  const notifications = runVitest(['tests/unit/notifications']);
  console.log(`Notifications ${notifications.ok ? 'PASS' : 'FAIL'} (${(notifications.durationMs / 1000).toFixed(1)}s)`);
  steps.push(
    stepFromResult('notifications', 'Notifications', notifications.ok, notifications.durationMs, {
      ...(notifications.passed !== undefined ? { passed: notifications.passed } : {}),
      ...(notifications.total !== undefined ? { total: notifications.total } : {}),
      ...(notifications.passed !== undefined && notifications.total !== undefined
        ? { failed: notifications.total - notifications.passed }
        : {}),
      ...(notifications.errorSummary !== undefined ? { error: notifications.errorSummary } : {}),
    }),
  );

  const buildStarted = Date.now();
  const buildLib = runBuildLib();
  let buildOk = false;
  let buildDetail: string | undefined;
  let buildError: string | undefined;
  let buildWarnings = buildLib.warningCount ?? 0;

  if (!buildLib.ok) {
    buildError = 'build:lib failed';
  } else {
    const buildApp = runBuildApp();
    buildWarnings += buildApp.warningCount ?? 0;
    buildOk = buildApp.ok;
    if (!buildApp.ok) {
      buildError = 'build:app failed';
    }
  }

  const buildTimeMs = Date.now() - buildStarted;
  const bundle = buildOk
    ? measureBundleSize([join(ROOT, 'dist'), join(ROOT, 'dist-app')])
    : { bytes: 0, files: 0 };

  if (buildOk) {
    buildDetail = `Build time: ${(buildTimeMs / 1000).toFixed(1)}s\nBundle size: ${formatBytes(bundle.bytes)} (${bundle.files} files)`;
  }

  console.log(`Build ${buildOk ? 'PASS' : 'FAIL'} (${(buildTimeMs / 1000).toFixed(1)}s)`);
  steps.push(
    stepFromResult('build', 'Build', buildOk, buildTimeMs, {
      ...(buildDetail !== undefined ? { detail: buildDetail } : {}),
      ...(buildError !== undefined ? { error: buildError } : {}),
      ...(buildWarnings > 0 ? { warnings: buildWarnings } : {}),
    }),
  );

  const smoke = runVitest([...SMOKE_TEST_PATHS]);
  console.log(`Smoke ${smoke.ok ? 'PASS' : 'FAIL'} (${(smoke.durationMs / 1000).toFixed(1)}s)`);
  steps.push(
    stepFromResult('smoke', 'Smoke', smoke.ok, smoke.durationMs, {
      ...(smoke.passed !== undefined ? { passed: smoke.passed } : {}),
      ...(smoke.total !== undefined ? { total: smoke.total } : {}),
      ...(smoke.passed !== undefined && smoke.total !== undefined
        ? { failed: smoke.total - smoke.passed }
        : {}),
      ...(smoke.errorSummary !== undefined ? { error: smoke.errorSummary } : {}),
    }),
  );

  if (includeProperty) {
    const property = runVitest([...PROPERTY_TEST_PATHS], [], { propertyProfile });
    steps.push(
      stepFromResult('property', 'Property Tests', property.ok, property.durationMs, {
        detail: `PROPERTY_PROFILE=${propertyProfile}`,
        ...(property.passed !== undefined ? { passed: property.passed } : {}),
        ...(property.total !== undefined ? { total: property.total } : {}),
        ...(property.passed !== undefined && property.total !== undefined
          ? { failed: property.total - property.passed }
          : {}),
        ...(property.errorSummary !== undefined ? { error: property.errorSummary } : {}),
      }),
    );
  }

  if (includeSoak) {
    const soak = await generateSoakReport();
    steps.push(
      stepFromResult('soak', 'Soak Report', soak.status === 'PASS', 0, {
        detail: soak.path,
        ...(soak.status === 'FAIL' ? { error: 'Collector health FAIL — see soak-report.md' } : {}),
      }),
    );
  }

  if (includePerformance) {
    const benchmark = runBenchmark();
    steps.push(
      stepFromResult('performance', 'Performance', benchmark.ok, benchmark.durationMs, {
        detail: 'pnpm benchmark',
        ...(benchmark.errorSummary !== undefined ? { error: benchmark.errorSummary } : {}),
      }),
    );
  }

  const stepWarningTotal = totalStepWarnings(steps);
  const qualityScore = computeQualityScore(steps);
  const outcome = computeVerifyOutcome(steps, profile, lintErrorCount, stepWarningTotal);

  const report: VerifyReport = {
    date,
    commit,
    branch,
    status: outcome.status,
    verdict: outcome.verdict,
    reasons: outcome.reasons,
    durationMs: Date.now() - started,
    warnings,
    steps,
    qualityScore,
    totalWarnings: stepWarningTotal,
    profile,
    nightlyFailures: outcome.nightlyFailures,
    lintErrorCount: lintErrorCount > 0 ? lintErrorCount : undefined,
    ...(buildOk
      ? {
          buildTimeMs,
          bundleBytes: bundle.bytes,
          bundleFiles: bundle.files,
        }
      : {}),
  };

  if (writeReports) {
    const paths = writeVerifyArtifacts(report);
    console.log(`Verify report → ${paths.markdownPath}`);
    console.log(`Latest JSON → ${paths.latestJsonPath}`);
  }

  return report;
}

async function main(): Promise<void> {
  console.log('Stake Planner verify (RC ~3 min)');
  const report = await runVerify({ profile: 'rc' });
  console.log(`\nOverall: ${report.verdict} (${(report.durationMs / 1000).toFixed(1)}s)`);
  if (report.qualityScore !== undefined) {
    console.log(`Quality: ${report.qualityScore.total} / ${report.qualityScore.max}`);
  }
  if (report.totalWarnings !== undefined && report.totalWarnings > 0) {
    console.log(`Warnings: ${report.totalWarnings}`);
  }
  if (report.nightlyFailures !== undefined && report.nightlyFailures.length > 0) {
    console.log('\nNightly (non-blocking for RC):');
    for (const item of report.nightlyFailures) {
      console.log(`  • ${item}`);
    }
  }
  if (report.reasons.length > 0) {
    console.log('\nReasons:');
    for (const reason of report.reasons) {
      console.log(`  • ${reason}`);
    }
  }
  const outcome = computeVerifyOutcome(
    report.steps,
    report.profile ?? 'rc',
    report.lintErrorCount ?? 0,
    report.totalWarnings ?? 0,
  );
  process.exit(outcome.exitOk ? 0 : 1);
}

void main();
