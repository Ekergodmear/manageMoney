import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  LatestJsonReport,
  QualityScoreBreakdown,
  TrendEntry,
  VerifyReport,
  VerifyStepReport,
  VerifyVerdict,
} from './lib/report-types.js';
import {
  NIGHTLY_STEP_IDS,
  RC_GATE_STEP_IDS,
  type VerifyProfile,
} from './lib/test-suites.js';
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
    verdict: report.verdict,
    reasons: report.reasons,
    tests: {
      typecheck: step('typecheck'),
      lint: step('lint'),
      unit: step('unit'),
      architecture: step('architecture'),
      gameData: step('gameData'),
      notifications: step('notifications'),
      build: step('build'),
      smoke: step('smoke'),
      property: step('property'),
      soak: step('soak'),
      performance: step('performance'),
    },
    durationMs: report.durationMs,
    ...(unit?.passed !== undefined ? { unitPassed: unit.passed } : {}),
    ...(unit?.total !== undefined ? { unitTotal: unit.total } : {}),
    ...(report.buildTimeMs !== undefined ? { buildTimeMs: report.buildTimeMs } : {}),
    ...(report.bundleBytes !== undefined ? { bundleBytes: report.bundleBytes } : {}),
    ...(report.qualityScore !== undefined ? { qualityScore: report.qualityScore.total } : {}),
    ...(report.totalWarnings !== undefined ? { totalWarnings: report.totalWarnings } : {}),
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
    if (step.warnings !== undefined && step.warnings > 0) {
      lines.push('', 'Warnings', '', String(step.warnings));
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

  if (report.qualityScore !== undefined) {
    const q = report.qualityScore;
    lines.push(
      '---',
      '',
      '## Quality',
      '',
      `Typecheck ${stepStatus(report, 'typecheck')}`,
      '',
      `${q.typecheck} / 20`,
      '',
      `Lint ${stepStatus(report, 'lint')}`,
      '',
      `${q.lint} / 20`,
      '',
      `Tests ${testsStatus(report)}`,
      '',
      `${q.tests} / 20`,
      '',
      `Architecture ${stepStatus(report, 'architecture')}`,
      '',
      `${q.architecture} / 20`,
      '',
      `Build ${stepStatus(report, 'build')}`,
      '',
      `${q.build} / 20`,
      '',
      'Quality Score',
      '',
      `${q.total} / ${q.max}`,
      '',
    );
  }

  if (report.nightlyFailures !== undefined && report.nightlyFailures.length > 0) {
    lines.push('## Nightly (non-blocking for RC)', '');
    for (const item of report.nightlyFailures) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  lines.push('---', '', '## Overall', '', report.verdict, '');

  if (report.reasons.length > 0) {
    lines.push('## Reasons', '');
    for (const reason of report.reasons) {
      lines.push(`- ${reason}`);
    }
    lines.push('');
  }

  lines.push(
    '---',
    '',
    '## Summary',
    '',
    `Gate status: ${report.status}`,
    '',
    `Duration: ${(report.durationMs / 1000).toFixed(1)}s`,
    `Warnings: ${report.totalWarnings ?? 0}`,
    '',
  );

  return lines.join('\n');
}

function stepStatus(report: VerifyReport, id: string): 'PASS' | 'FAIL' {
  const step = report.steps.find((s) => s.id === id);
  return step?.status === 'PASS' ? 'PASS' : 'FAIL';
}

function testsStatus(report: VerifyReport): 'PASS' | 'FAIL' {
  const ids = ['unit', 'gameData', 'notifications', 'smoke'] as const;
  return ids.every((id) => report.steps.find((s) => s.id === id)?.status === 'PASS')
    ? 'PASS'
    : 'FAIL';
}

const QUALITY_POINTS = 20;

export function computeQualityScore(steps: readonly VerifyStepReport[]): QualityScoreBreakdown {
  const status = (id: string): boolean =>
    steps.find((s) => s.id === id)?.status === 'PASS';

  const testsOk =
    status('unit') && status('gameData') && status('notifications') && status('smoke');

  const typecheck = status('typecheck') ? QUALITY_POINTS : 0;
  const lint = status('lint') ? QUALITY_POINTS : 0;
  const tests = testsOk ? QUALITY_POINTS : 0;
  const architecture = status('architecture') ? QUALITY_POINTS : 0;
  const build = status('build') ? QUALITY_POINTS : 0;

  return {
    typecheck,
    lint,
    tests,
    architecture,
    build,
    total: typecheck + lint + tests + architecture + build,
    max: QUALITY_POINTS * 5,
  };
}

export function totalStepWarnings(steps: readonly VerifyStepReport[]): number {
  return steps.reduce((sum, step) => sum + (step.warnings ?? 0), 0);
}

function stepPasses(steps: readonly VerifyStepReport[], id: string): boolean {
  return steps.find((s) => s.id === id)?.status === 'PASS';
}

export function rcGatesPass(
  steps: readonly VerifyStepReport[],
  lintErrorCount: number,
  totalWarnings: number,
): boolean {
  if (lintErrorCount > 0 || totalWarnings > 0) {
    return false;
  }
  return RC_GATE_STEP_IDS.every((id) => stepPasses(steps, id));
}

export function computeVerifyOutcome(
  steps: readonly VerifyStepReport[],
  profile: VerifyProfile,
  lintErrorCount: number,
  totalWarnings: number,
): {
  readonly verdict: VerifyVerdict;
  readonly status: 'PASS' | 'FAIL';
  readonly reasons: readonly string[];
  readonly nightlyFailures: readonly string[];
  readonly exitOk: boolean;
} {
  const reasons = buildVerifyReasons(steps, lintErrorCount, totalWarnings, profile);
  const nightlyFailures: string[] = [];
  const rcOk = rcGatesPass(steps, lintErrorCount, totalWarnings);

  for (const id of NIGHTLY_STEP_IDS) {
    const step = steps.find((s) => s.id === id);
    if (step !== undefined && step.status === 'FAIL') {
      nightlyFailures.push(`${step.name} failed`);
    }
  }

  if (profile === 'nightly') {
    const allOk = steps.every((s) => s.status === 'PASS' || s.status === 'SKIP');
    const verdict: VerifyVerdict = allOk && lintErrorCount === 0 && totalWarnings === 0
      ? 'READY'
      : 'NOT READY';
    return {
      verdict,
      status: verdict === 'READY' ? 'PASS' : 'FAIL',
      reasons,
      nightlyFailures,
      exitOk: verdict === 'READY',
    };
  }

  if (!rcOk) {
    return {
      verdict: 'NOT READY',
      status: 'FAIL',
      reasons,
      nightlyFailures,
      exitOk: false,
    };
  }

  if (nightlyFailures.length > 0) {
    return {
      verdict: 'READY FOR RC',
      status: 'PASS',
      reasons: [...reasons, 'except Property / Nightly gates'],
      nightlyFailures,
      exitOk: true,
    };
  }

  return {
    verdict: 'READY FOR RC',
    status: 'PASS',
    reasons,
    nightlyFailures,
    exitOk: true,
  };
}

export function buildVerifyReasons(
  steps: readonly VerifyStepReport[],
  lintErrorCount: number,
  totalWarnings = 0,
  profile: VerifyProfile = 'rc',
): string[] {
  const reasons: string[] = [];

  if (lintErrorCount > 0) {
    reasons.push(`${lintErrorCount} lint error(s)`);
  }

  if (totalWarnings > 0) {
    reasons.push(`${totalWarnings} build warning(s)`);
  }

  const testSteps = steps.filter((s) =>
    ['unit', 'architecture', 'gameData', 'notifications', 'smoke'].includes(s.id),
  );
  let failingTests = 0;
  for (const step of testSteps) {
    if (step.status === 'FAIL' && step.failed !== undefined && step.failed > 0) {
      failingTests += step.failed;
    }
  }
  if (failingTests > 0) {
    reasons.push(`${failingTests} failing unit test(s)`);
  }

  for (const step of steps) {
    if (step.status !== 'FAIL') {
      continue;
    }
    if (profile === 'rc' && (NIGHTLY_STEP_IDS as readonly string[]).includes(step.id)) {
      continue;
    }
    if (step.id === 'lint' && lintErrorCount > 0) {
      continue;
    }
    if (testSteps.includes(step) && failingTests > 0) {
      continue;
    }
    reasons.push(`${step.name} failed`);
  }

  return reasons;
}

export function stepFromResult(
  id: string,
  name: string,
  ok: boolean,
  durationMs: number,
  extra?: Partial<VerifyStepReport> & { readonly warningCount?: number },
): VerifyStepReport {
  const warnings = extra?.warnings ?? extra?.warningCount;
  const base: VerifyStepReport = {
    id,
    name,
    status: ok ? 'PASS' : 'FAIL',
    durationMs,
    ...(warnings !== undefined && warnings > 0 ? { warnings } : {}),
  };
  if (extra?.passed !== undefined) {
    return {
      ...base,
      passed: extra.passed,
      ...(extra.total !== undefined ? { total: extra.total } : {}),
      ...(extra.failed !== undefined ? { failed: extra.failed } : {}),
      ...(extra.detail !== undefined ? { detail: extra.detail } : {}),
      ...(!ok && extra.error !== undefined ? { error: extra.error } : {}),
    };
  }
  return {
    ...base,
    ...(extra?.total !== undefined ? { total: extra.total } : {}),
    ...(extra?.failed !== undefined ? { failed: extra.failed } : {}),
    ...(extra?.detail !== undefined ? { detail: extra.detail } : {}),
    ...(!ok && extra?.error !== undefined ? { error: extra.error } : {}),
  };
}

export function writeMarkdown(path: string, content: string): void {
  ensureReportsDir();
  writeFileSync(path, content, 'utf-8');
}
