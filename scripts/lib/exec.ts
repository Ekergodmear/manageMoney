import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface StepResult {
  readonly ok: boolean;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly durationMs: number;
  readonly passed?: number;
  readonly total?: number;
  readonly errorSummary?: string;
}

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

function binPath(...segments: string[]): string {
  return join(ROOT, 'node_modules', ...segments);
}

function runNode(args: readonly string[], options?: { readonly cwd?: string }): StepResult {
  const started = Date.now();
  const result = spawnSync(process.execPath, [...args], {
    cwd: options?.cwd ?? ROOT,
    encoding: 'utf-8',
    shell: false,
    maxBuffer: 20 * 1024 * 1024,
  });
  const durationMs = Date.now() - started;
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const exitCode = result.status ?? 1;
  const ok = exitCode === 0;

  return {
    ok,
    exitCode,
    stdout,
    stderr,
    durationMs,
    ...(ok ? {} : { errorSummary: summarizeError(stdout, stderr) }),
  };
}

export function runTypecheck(): StepResult {
  const tsc = binPath('typescript', 'bin', 'tsc');
  return runNode([tsc, '--noEmit']);
}

export function runLint(): StepResult {
  const eslint = binPath('eslint', 'bin', 'eslint.js');
  return runNode([eslint, '.', '--max-warnings', '0']);
}

export function runBuildLib(): StepResult {
  const vite = binPath('vite', 'bin', 'vite.js');
  return runNode([vite, 'build', '--config', 'vite.lib.config.ts']);
}

export function runBuildApp(): StepResult {
  const vite = binPath('vite', 'bin', 'vite.js');
  return runNode([vite, 'build']);
}

export function runVitest(
  paths: readonly string[],
  excludes: readonly string[] = [],
): StepResult {
  const vitest = binPath('vitest', 'vitest.mjs');
  const outputFile = join(ROOT, 'reports', '.tmp-vitest.json');
  const args = [vitest, 'run', ...paths, '--reporter=json', `--outputFile=${outputFile}`];
  for (const pattern of excludes) {
    args.push('--exclude', pattern);
  }

  const step = runNode(args);
  const counts = parseVitestJsonOutput(outputFile);
  const errorSummary =
    step.ok === false ? (counts.failureDetail ?? step.errorSummary) : step.errorSummary;

  return {
    ...step,
    passed: counts.passed,
    total: counts.total,
    ...(errorSummary !== undefined ? { errorSummary } : {}),
  };
}

function parseVitestJsonOutput(path: string): {
  passed: number;
  total: number;
  failureDetail?: string;
} {
  try {
    if (!existsSync(path)) {
      return { passed: 0, total: 0 };
    }
    const raw = JSON.parse(readFileSync(path, 'utf-8')) as {
      numPassedTests?: number;
      numTotalTests?: number;
      testResults?: Array<{
        name: string;
        status: string;
        assertionResults?: Array<{ title: string; status: string; failureMessages?: string[] }>;
      }>;
    };
    const passed = raw.numPassedTests ?? 0;
    const total = raw.numTotalTests ?? 0;
    let failureDetail: string | undefined;
    if (raw.testResults) {
      for (const suite of raw.testResults) {
        if (suite.status === 'failed') {
          const failedTest = suite.assertionResults?.find((a) => a.status === 'failed');
          if (failedTest) {
            const msg = failedTest.failureMessages?.[0] ?? '';
            failureDetail = `${suite.name} › ${failedTest.title}\n${truncate(msg, 800)}`;
            break;
          }
        }
      }
    }
    return failureDetail === undefined
      ? { passed, total }
      : { passed, total, failureDetail };
  } catch {
    return { passed: 0, total: 0 };
  }
}

function summarizeError(stdout: string, stderr: string): string {
  return truncate(`${stdout}\n${stderr}`.trim(), 1200);
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max)}\n…`;
}
