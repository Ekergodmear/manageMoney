import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StepResult } from './exec.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

function binPath(...segments: string[]): string {
  return join(ROOT, 'node_modules', ...segments);
}

export interface EslintIssue {
  readonly ruleId: string | null;
  readonly message: string;
  readonly filePath: string;
}

export interface EslintRuleSummary {
  readonly byRule: readonly { readonly rule: string; readonly count: number }[];
  readonly total: number;
  readonly otherCount: number;
}

export function runLintJson(outputPath: string): StepResult {
  const eslint = binPath('eslint', 'bin', 'eslint.js');
  const started = Date.now();
  const result = spawnSync(
    process.execPath,
    [eslint, '.', '--max-warnings', '0', '-f', 'json', '-o', outputPath],
    {
      cwd: ROOT,
      encoding: 'utf-8',
      shell: false,
      maxBuffer: 50 * 1024 * 1024,
    },
  );
  const durationMs = Date.now() - started;
  const exitCode = result.status ?? 1;
  return {
    ok: exitCode === 0,
    exitCode,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    durationMs,
  };
}

export function parseEslintJson(jsonPath: string): EslintIssue[] {
  if (!existsSync(jsonPath)) {
    return [];
  }
  try {
    const raw = JSON.parse(readFileSync(jsonPath, 'utf-8')) as Array<{
      filePath: string;
      messages: Array<{ ruleId: string | null; message: string }>;
    }>;
    const issues: EslintIssue[] = [];
    for (const file of raw) {
      for (const msg of file.messages) {
        issues.push({
          ruleId: msg.ruleId,
          message: msg.message,
          filePath: file.filePath,
        });
      }
    }
    return issues;
  } catch {
    return [];
  }
}

export function summarizeEslintRules(issues: readonly EslintIssue[]): EslintRuleSummary {
  const counts = new Map<string, number>();
  for (const issue of issues) {
    const key = issue.ruleId ?? 'unknown';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const byRule = [...counts.entries()]
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count);

  return {
    byRule,
    total: issues.length,
    otherCount: 0,
  };
}
