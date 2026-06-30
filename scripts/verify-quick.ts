import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { formatBytes, measureBundleSize } from './lib/bundle-size.js';
import { runBuildLib, runTypecheck, runVitest } from './lib/exec.js';
import { readGitBranch, readGitCommitSha } from './lib/git.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const SMOKE_TESTS = [
  'tests/unit/planning/session-rollout-smoke.spec.ts',
  'tests/unit/game-data/statistics.test.ts',
  'tests/compat/public-api-snapshot.test.ts',
];

async function main(): Promise<void> {
  const started = Date.now();
  console.log('Stake Planner verify:quick');

  const typecheck = runTypecheck();
  if (!typecheck.ok) {
    console.error('Typecheck FAIL');
    process.exit(1);
  }
  console.log('Typecheck PASS');

  const buildStarted = Date.now();
  const buildLib = runBuildLib();
  if (!buildLib.ok) {
    console.error('Build FAIL (lib)');
    process.exit(1);
  }
  const buildTimeMs = Date.now() - buildStarted;
  const bundle = measureBundleSize([join(ROOT, 'dist')]);
  console.log(`Build PASS (${(buildTimeMs / 1000).toFixed(1)}s, ${formatBytes(bundle.bytes)})`);

  const smoke = runVitest(SMOKE_TESTS);
  if (!smoke.ok) {
    console.error('Smoke tests FAIL');
    if (smoke.errorSummary) {
      console.error(smoke.errorSummary);
    }
    process.exit(1);
  }
  console.log(`Smoke tests PASS (${smoke.passed ?? 0}/${smoke.total ?? 0})`);

  const durationMs = Date.now() - started;
  console.log(`\nREADY (${(durationMs / 1000).toFixed(1)}s)`);
  console.log(`Commit: ${readGitCommitSha()} | Branch: ${readGitBranch()}`);
  process.exit(0);
}

void main();
