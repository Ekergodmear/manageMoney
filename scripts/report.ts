import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { LatestJsonReport, TrendEntry, VerifyReport, VerifyStepReport } from './lib/report-types.js';
import { formatBytes } from './lib/bundle-size.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
export const REPORTS_DIR = join(ROOT, 'reports');

export function ensureReportsDir(): void {
  mkdirSync(REPORTS_DIR, { recursive: true });
}

export function writeVerifyArtifacts(report: VerifyReport): {
  markdownPath: string;
  latestJsonPath: string;
  trendJsonPath: string;
} {
  ensureReportsDir();
  const dateSlug = report.date.slice(0, 10);
  const markdownPath = join(REPORTS_DIR, `${dateSlug}-verify.md`);
  const latestJsonPath = join(REPORTS_DIR, 'latest.json');
  const trendJsonPath = join(REPORTS_DIR, 'trend.json');

  writeFileSync(markdownPath, formatVerifyMarkdown(report), 'utf-8');
  writeFileSync(latestJsonPath, `${JSON.stringify(toLatestJson(report), null, 2)}\n`, 'utf-8');
  writeFileSync(trendJsonPath, `${JSON.stringify(appendTrend(report), null, 2)}\n`, 'utf-8');

  return { markdownPath, latestJsonPath, trendJsonPath };
}

function toLatestJson(report: VerifyReport): LatestJsonReport {
  const step = (id: string): 'PASS' | 'FAIL' | 'SKIP' => {
    const found = report.steps.find((s) => s.id === id);
    if (found === undefined) {
      return 'SKIP';
    }
    return found.status;
  };
  const unit = report.steps.find((s) => s.id === 'unit');

  return {
    date: report.date,
    commit: report.commit,
    branch: report.branch,
    status: report.status,
    tests: {
      typecheck: step('typecheck'),
      lint: step('lint'),
      unit: step('unit'),
      architecture: step('architecture'),
      gameData: step('gameData'),
      notifications: step('notifications'),
      build: step('build'),
    },
    durationMs: report.durationMs,
    ...(unit?.passed !== undefined ? { unitPassed: unit.passed } : {}),
    ...(unit?.total !== undefined ? { unitTotal: unit.total } : {}),
    ...(report.buildTimeMs !== undefined ? { buildTimeMs: report.buildTimeMs } : {}),
    ...(report.bundleBytes !== undefined ? { bundleBytes: report.bundleBytes } : {}),
  };
}

function appendTrend(report: VerifyReport): TrendEntry[] {
  const trendPath = join(REPORTS_DIR, 'trend.json');
  let existing: TrendEntry[] = [];
  if (existsSync(trendPath)) {
    try {
      existing = JSON.parse(readFileSync(trendPath, 'utf-8')) as TrendEntry[];
    } catch {
      existing = [];
    }
  }

  const unit = report.steps.find((s) => s.id === 'unit');
  const entry: TrendEntry = {
    date: report.date.slice(0, 10),
    tests: unit?.total ?? 0,
    passed: unit?.passed ?? 0,
    durationMs: report.durationMs,
    status: report.status,
  };

  const withoutSameDay = existing.filter((e) => e.date !== entry.date);
  return [...withoutSameDay, entry].sort((a, b) => a.date.localeCompare(b.date));
}

function formatVerifyMarkdown(report: VerifyReport): string {
  const lines: string[] = [
    '# Verify Report',
    '',
    `Date: ${report.date}`,
    `Commit: ${report.commit}`,
    `Branch: ${report.branch}`,
    '',
  ];

  for (const step of report.steps) {
    lines.push('---', '', `## ${step.name}`, '', step.status);
    if (step.passed !== undefined && step.total !== undefined) {
      lines.push('', `${step.passed} / ${step.total}`);
    }
    if (step.detail) {
      lines.push('', step.detail);
    }
    if (step.status === 'FAIL' && step.error) {
      lines.push('', 'Error', '', '```', step.error, '```');
    }
    lines.push('');
  }

  const build = report.steps.find((s) => s.id === 'build');
  if (build && report.buildTimeMs !== undefined) {
    lines.push('Build time:', `${(report.buildTimeMs / 1000).toFixed(1)}s`);
    if (report.bundleBytes !== undefined) {
      lines.push('Bundle size:', formatBytes(report.bundleBytes));
      if (report.bundleFiles !== undefined) {
        lines.push(`(${report.bundleFiles} files)`);
      }
    }
    lines.push('');
  }

  lines.push(
    '---',
    '',
    '## Summary',
    '',
    report.status,
    '',
    `Duration: ${(report.durationMs / 1000).toFixed(1)}s`,
    `Warnings: ${report.warnings.length === 0 ? 'none' : report.warnings.join('; ')}`,
    '',
  );

  return lines.join('\n');
}

export function stepFromResult(
  id: string,
  name: string,
  ok: boolean,
  durationMs: number,
  extra?: Partial<VerifyStepReport>,
): VerifyStepReport {
  const base: VerifyStepReport = {
    id,
    name,
    status: ok ? 'PASS' : 'FAIL',
    durationMs,
  };
  if (extra?.passed !== undefined) {
    return { ...base, passed: extra.passed, ...(extra.total !== undefined ? { total: extra.total } : {}), ...(extra.detail !== undefined ? { detail: extra.detail } : {}), ...(!ok && extra.error !== undefined ? { error: extra.error } : {}) };
  }
  return {
    ...base,
    ...(extra?.total !== undefined ? { total: extra.total } : {}),
    ...(extra?.detail !== undefined ? { detail: extra.detail } : {}),
    ...(!ok && extra?.error !== undefined ? { error: extra.error } : {}),
  };
}

export function writeMarkdown(path: string, content: string): void {
  ensureReportsDir();
  writeFileSync(path, content, 'utf-8');
}
