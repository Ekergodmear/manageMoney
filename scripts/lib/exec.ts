import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { countBuildWarnings } from './warnings.js';

export interface StepResult {
  readonly ok: boolean;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly durationMs: number;
  readonly passed?: number;
  readonly total?: number;
  readonly errorSummary?: string;
  readonly warningCount?: number;
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

function withBuildWarnings(step: StepResult): StepResult {
  const warningCount = countBuildWarnings(`${step.stdout}\n${step.stderr}`);
  return warningCount > 0 ? { ...step, warningCount } : step;
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
  return withBuildWarnings(runNode([vite, 'build', '--config', 'vite.lib.config.ts']));
}

export function runBuildApp(): StepResult {
  const vite = binPath('vite', 'bin', 'vite.js');
  return withBuildWarnings(runNode([vite, 'build']));
}

export function runBenchmark(): StepResult {
  const tsx = binPath('tsx', 'dist', 'cli.mjs');
  return runNode([tsx, 'benchmarks/run.ts']);
}

export function runUnitTestsBatched(): StepResult {
  const runner = join(ROOT, 'scripts', 'test-unit-batched.mjs');
  const started = Date.now();
  const result = spawnSync(process.execPath, [runner], {
    cwd: ROOT,
    shell: false,
    stdio: 'inherit',
    env: process.env,
  });
  const durationMs = Date.now() - started;
  const exitCode = result.status ?? 1;
  const ok = exitCode === 0;
  return {
    ok,
    exitCode,
    stdout: '',
    stderr: '',
    durationMs,
    ...(ok ? {} : { errorSummary: `unit batches exit ${String(exitCode)}` }),
  };
}

export function runVitest(
  paths: readonly string[],
  excludes: readonly string[] = [],
  options?: { readonly propertyProfile?: string },
): StepResult {
  const runner = join(ROOT, 'scripts', 'run-vitest.mjs');
  const args = [runner, ...paths];
  for (const pattern of excludes) {
    args.push('--exclude', pattern);
  }

  const env = { ...process.env };
  if (options?.propertyProfile !== undefined) {
    env.PROPERTY_PROFILE = options.propertyProfile;
  }

  const started = Date.now();
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT,
    shell: false,
    stdio: 'inherit',
    env,
  });
  const durationMs = Date.now() - started;
  const exitCode = result.status ?? 1;
  const ok = exitCode === 0;
  const step: StepResult = {
    ok,
    exitCode,
    stdout: '',
    stderr: '',
    durationMs,
    ...(ok ? {} : { errorSummary: `vitest exit ${String(exitCode)}` }),
  };
  return step;
}

function parseVitestStdout(output: string): {
  passed: number;
  total: number;
  failureDetail?: string;
} {
  const filesMatch = output.match(/Tests\s+(\d+)\s+failed\s*\|\s*(\d+)\s+passed\s*\((\d+)\)/);
  if (filesMatch !== null) {
    const failed = Number(filesMatch[1]);
    const passed = Number(filesMatch[2]);
    const total = Number(filesMatch[3]);
    return { passed, total, ...(failed > 0 ? { failureDetail: `${failed} failed` } : {}) };
  }
  const passMatch = output.match(/Tests\s+(\d+)\s+passed\s*\((\d+)\)/);
  if (passMatch !== null) {
    return { passed: Number(passMatch[1]), total: Number(passMatch[2]) };
  }
  return { passed: 0, total: 0 };
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
    return failureDetail === undefined ? { passed, total } : { passed, total, failureDetail };
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
