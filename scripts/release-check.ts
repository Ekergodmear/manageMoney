import { join } from 'node:path';

import { runVitest } from './lib/exec.js';
import { isGitClean, readGitBranch, readGitCommitSha } from './lib/git.js';
import { REPORTS_DIR, writeMarkdown } from './report.js';
import { runVerify } from './verify.js';
import { generateSoakReport } from './soak-report.js';

const COLLECTOR_BASE = process.env['COLLECTOR_HTTP_URL'] ?? 'http://localhost:8788';

interface ReleaseCheck {
  readonly name: string;
  readonly ok: boolean;
  readonly detail?: string;
}

async function checkCollectorHealth(): Promise<ReleaseCheck> {
  try {
    const res = await fetch(`${COLLECTOR_BASE}/health`);
    if (!res.ok) {
      return { name: 'Collector Health', ok: false, detail: `HTTP ${res.status}` };
    }
    const body = (await res.json()) as { failureCount?: number; overall?: string; status?: string };
    const ok =
      (body.overall === 'healthy' || body.status === 'running') && (body.failureCount ?? 0) < 10;
    return {
      name: 'Collector Health',
      ok,
      detail: `failures=${body.failureCount ?? '?'} status=${body.status ?? body.overall ?? '?'}`,
    };
  } catch (err) {
    return {
      name: 'Collector Health',
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

function checkStatisticsTests(): ReleaseCheck {
  const result = runVitest(['tests/unit/game-data/statistics.test.ts']);
  return {
    name: 'Statistics',
    ok: result.ok,
    ...(result.total !== undefined ? { detail: `${result.passed ?? 0}/${result.total}` } : {}),
  };
}

function checkNotificationTests(): ReleaseCheck {
  const result = runVitest(['tests/unit/notifications']);
  return {
    name: 'Notifications',
    ok: result.ok,
    ...(result.total !== undefined ? { detail: `${result.passed ?? 0}/${result.total}` } : {}),
  };
}

async function main(): Promise<void> {
  const date = new Date().toISOString();
  const commit = readGitCommitSha();
  const branch = readGitBranch();
  const gitCleanAtStart = isGitClean();
  const checks: ReleaseCheck[] = [];

  console.log('Release check — running verify…');
  const verify = await runVerify({ writeReports: true });
  const verifySteps = [
    'Typecheck',
    'Lint',
    'Unit Tests',
    'Architecture',
    'Game Data',
    'Notifications',
    'Build',
  ];
  for (const name of verifySteps) {
    const step = verify.steps.find((s) => s.name === name);
    checks.push({
      name,
      ok: step?.status === 'PASS',
      ...(step?.passed !== undefined && step.total !== undefined
        ? { detail: `${step.passed}/${step.total}` }
        : {}),
    });
  }

  const smoke = verify.steps.find((s) => s.id === 'smoke');
  checks.push({
    name: 'Smoke',
    ok: smoke?.status === 'PASS',
    ...(smoke?.passed !== undefined && smoke.total !== undefined
      ? { detail: `${smoke.passed}/${smoke.total}` }
      : {}),
  });

  checks.push(await checkCollectorHealth());
  checks.push(checkStatisticsTests());
  checks.push(checkNotificationTests());

  console.log('Release check — soak report…');
  const soak = await generateSoakReport();
  checks.push({ name: 'Soak Status', ok: soak.status === 'PASS', detail: soak.status });

  checks.push({
    name: 'Git Clean',
    ok: gitCleanAtStart,
    detail: gitCleanAtStart ? 'clean at start' : 'dirty working tree at start',
  });

  const failures = checks.filter((c) => !c.ok);
  const ready = failures.length === 0;
  const verdict =
    verify.verdict === 'READY' || verify.verdict === 'READY FOR RC'
      ? 'READY FOR INTERNAL RC'
      : 'NOT READY';

  const lines: string[] = [
    '# Release Report',
    '',
    `Date: ${date}`,
    `Commit: ${commit}`,
    `Branch: ${branch}`,
    '',
    '---',
    '',
    '## Checks',
    '',
    '| Check | Status | Detail |',
    '| --- | --- | --- |',
  ];

  for (const check of checks) {
    lines.push(`| ${check.name} | ${check.ok ? 'PASS' : 'FAIL'} | ${check.detail ?? '—'} |`);
  }

  lines.push('', '---', '', '## Verdict', '', verdict);

  if (!ready) {
    lines.push('', 'Reason', '');
    for (const fail of failures) {
      lines.push(`- ${fail.name}${fail.detail ? `: ${fail.detail}` : ''}`);
    }
  }

  const path = join(REPORTS_DIR, 'release-report.md');
  writeMarkdown(path, lines.join('\n'));
  console.log(`Release report → ${path}`);
  console.log(`\nVerdict: ${verdict}`);

  process.exit(ready ? 0 : 1);
}

void main();
