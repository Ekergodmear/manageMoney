import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildBingo18Markets } from '@/features/game-data/markets/bingo18-markets';
import type { DrawRecord } from '@/features/game-data/statistics/statistics-types';
import { computeGameStatistics } from '@/features/game-data/statistics/statistics-engine';

import { readGitBranch, readGitCommitSha } from './lib/git.js';
import { REPORTS_DIR, writeMarkdown } from './report.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const COLLECTOR_BASE = process.env['COLLECTOR_HTTP_URL'] ?? 'http://localhost:8788';

interface CollectorDraw {
  readonly drawKey: string;
  readonly drawAt: string;
  readonly publishedAt: string;
  readonly collectedAt: string;
  readonly latencyMs: number;
  readonly dice: readonly [number, number, number];
  readonly total: number;
  readonly flower: string | null;
  readonly smallLarge: 'small' | 'tie' | 'large';
}

interface DashboardPayload {
  readonly generatedAt: string;
  readonly collector: { readonly version: string; readonly commit: string | null };
  readonly health: {
    readonly status: string;
    readonly overall: string;
    readonly lastPollAt: string | null;
    readonly lastSuccessAt: string | null;
    readonly averageLatencyMs: number;
    readonly failureCount: number;
    readonly activeAdapterId: string;
    readonly drawCount: number;
    readonly lastDrawKey: string | null;
  };
  readonly latestDraw: CollectorDraw | null;
}

interface SoakAnalysis {
  readonly duplicateCount: number;
  readonly gapCount: number;
  readonly gapSamples: readonly string[];
  readonly averagePublishDelayMs: number;
  readonly apiReachable: boolean;
  readonly apiError?: string;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${COLLECTOR_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${path}`);
  }
  return (await res.json()) as T;
}

function parseDrawKeyMs(drawKey: string): number | null {
  if (drawKey.length < 14) {
    return null;
  }
  const y = Number(drawKey.slice(0, 4));
  const mo = Number(drawKey.slice(4, 6)) - 1;
  const d = Number(drawKey.slice(6, 8));
  const h = Number(drawKey.slice(8, 10));
  const mi = Number(drawKey.slice(10, 12));
  const s = Number(drawKey.slice(12, 14));
  const dt = new Date(y, mo, d, h, mi, s);
  return Number.isNaN(dt.getTime()) ? null : dt.getTime();
}

function analyzeDraws(draws: readonly CollectorDraw[]): SoakAnalysis {
  const keys = draws.map((d) => d.drawKey);
  const unique = new Set(keys);
  const duplicateCount = keys.length - unique.size;

  const sorted = [...draws].sort((a, b) => a.drawKey.localeCompare(b.drawKey));
  const gapSamples: string[] = [];
  let gapCount = 0;
  const expectedIntervalMs = 3 * 60_000;
  const toleranceMs = 30_000;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev === undefined || curr === undefined) {
      continue;
    }
    const prevMs = parseDrawKeyMs(prev.drawKey);
    const currMs = parseDrawKeyMs(curr.drawKey);
    if (prevMs === null || currMs === null) {
      continue;
    }
    const delta = currMs - prevMs;
    if (delta > expectedIntervalMs + toleranceMs) {
      gapCount += 1;
      if (gapSamples.length < 5) {
        gapSamples.push(`${prev.drawKey} → ${curr.drawKey} (${Math.round(delta / 60_000)}m)`);
      }
    }
  }

  let delaySum = 0;
  let delayCount = 0;
  for (const draw of draws) {
    const published = new Date(draw.publishedAt).getTime();
    const collected = new Date(draw.collectedAt).getTime();
    if (!Number.isNaN(published) && !Number.isNaN(collected)) {
      delaySum += Math.max(0, collected - published);
      delayCount += 1;
    }
  }

  return {
    duplicateCount,
    gapCount,
    gapSamples,
    averagePublishDelayMs: delayCount > 0 ? delaySum / delayCount : 0,
    apiReachable: true,
  };
}

function toDrawRecord(draw: CollectorDraw): DrawRecord {
  return {
    drawKey: draw.drawKey,
    drawAt: draw.drawAt,
    dice: draw.dice,
    total: draw.total,
    flower: draw.flower,
    smallLarge: draw.smallLarge,
  };
}

function formatStatisticsSection(draws: readonly CollectorDraw[]): string[] {
  if (draws.length === 0) {
    return ['_No draws available for statistics._'];
  }

  const markets = buildBingo18Markets({
    type: 'tier-tax',
    threshold: '10.000.000',
    ratePercent: '10',
  });
  const snapshot = computeGameStatistics(draws.map(toDrawRecord), markets);
  const lines: string[] = [];

  const topVariance = snapshot.rankings.byVariance.slice(0, 5);
  lines.push('### Top variance', '');
  for (const id of topVariance) {
    const m = snapshot.markets.find((x) => x.marketId === id);
    if (m) {
      lines.push(`- ${m.label}: variance ${m.variance.toFixed(2)}`);
    }
  }

  const topDrought = snapshot.rankings.byDrought.slice(0, 5);
  lines.push('', '### Top drought', '');
  for (const id of topDrought) {
    const m = snapshot.markets.find((x) => x.marketId === id);
    if (m) {
      lines.push(`- ${m.label}: drought ${m.drought}`);
    }
  }

  for (const window of snapshot.rollingWindows) {
    lines.push('', `### Rolling ${window.windowSize}`, '');
    lines.push(`Draws in window: ${window.drawCount}`);
    const hot = [...window.markets].sort((a, b) => b.hitRateDelta - a.hitRateDelta)[0];
    const cold = [...window.markets].sort((a, b) => b.drought - a.drought)[0];
    if (hot) {
      lines.push(`- Hot: ${hot.label} (Δ ${(hot.hitRateDelta * 100).toFixed(2)}%)`);
    }
    if (cold) {
      lines.push(`- Cold: ${cold.label} (drought ${cold.drought})`);
    }
  }

  return lines;
}

function formatNotificationSection(): string[] {
  return [
    '_NotificationCenter state is browser-local (persist v6)._',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    '| Unread | N/A (run app) |',
    '| Read | N/A (run app) |',
    '| Win notifications | N/A |',
    '| Collector notifications | N/A |',
    '| Offline events | N/A |',
  ];
}

function formatPerformanceSection(): string[] {
  const benchPath = join(ROOT, 'benchmarks', 'results', 'latest.json');
  if (!existsSync(benchPath)) {
    return ['_No benchmark artifact — run `pnpm benchmark`._'];
  }

  try {
    const artifact = JSON.parse(readFileSync(benchPath, 'utf-8')) as {
      measuredAt?: string;
      results?: { latency?: Array<{ capability: string; scenario: string; latencyUsPerOp: number }> };
    };
    const rows = artifact.results?.latency ?? [];
    const lines = [`Measured at: ${artifact.measuredAt ?? 'unknown'}`, ''];
    for (const row of rows.slice(0, 8)) {
      lines.push(`- ${row.capability} / ${row.scenario}: ${row.latencyUsPerOp.toFixed(2)} µs/op`);
    }
    lines.push('', '_Library/Dashboard render benchmarks not yet instrumented._');
    lines.push('_PlayedRound count requires browser session state._');
    return lines;
  } catch {
    return ['_Failed to parse benchmarks/results/latest.json._'];
  }
}

function computeUptime(lastSuccessAt: string | null): string {
  if (lastSuccessAt === null) {
    return 'unknown';
  }
  const ageMs = Date.now() - new Date(lastSuccessAt).getTime();
  if (ageMs < 0) {
    return 'unknown';
  }
  const hours = Math.floor(ageMs / 3_600_000);
  const mins = Math.floor((ageMs % 3_600_000) / 60_000);
  return `${hours}h ${mins}m since last success`;
}

export async function generateSoakReport(): Promise<{ path: string; status: 'PASS' | 'FAIL' }> {
  const date = new Date().toISOString();
  const commit = readGitCommitSha();
  const branch = readGitBranch();

  let dashboard: DashboardPayload | null = null;
  let recentDraws: CollectorDraw[] = [];
  let apiError: string | undefined;

  try {
    dashboard = await fetchJson<DashboardPayload>('/dashboard');
    const recent = await fetchJson<{ draws: CollectorDraw[] }>('/draws/recent?limit=2000');
    recentDraws = recent.draws;
  } catch (err) {
    apiError = err instanceof Error ? err.message : String(err);
  }

  const analysis =
    recentDraws.length > 0
      ? analyzeDraws(recentDraws)
      : {
          duplicateCount: 0,
          gapCount: 0,
          gapSamples: [] as string[],
          averagePublishDelayMs: 0,
          apiReachable: dashboard !== null,
          apiError,
        };

  const health = dashboard?.health;
  const failures = health?.failureCount ?? 0;
  const collectorHealthy =
    dashboard !== null &&
    health !== undefined &&
    (health.overall === 'healthy' || health.status === 'running') &&
    failures < 10 &&
    analysis.duplicateCount === 0;

  const status: 'PASS' | 'FAIL' =
    collectorHealthy && apiError === undefined && analysis.gapCount === 0 ? 'PASS' : 'FAIL';

  const lines: string[] = [
    '# Soak Report',
    '',
    `Date: ${date}`,
    `Commit: ${commit}`,
    `Branch: ${branch}`,
    `Collector: ${COLLECTOR_BASE}`,
    '',
    '---',
    '',
    '## Collector',
    '',
    `Uptime: ${computeUptime(health?.lastSuccessAt ?? null)}`,
    `Status: ${health?.status ?? 'unreachable'}`,
    `Adapter: ${health?.activeAdapterId ?? '—'}`,
    `Draw count: ${health?.drawCount ?? 0}`,
    '',
    '## Latest draw',
    '',
  ];

  const latest = dashboard?.latestDraw;
  if (latest) {
    lines.push(
      `- Key: ${latest.drawKey}`,
      `- Draw at: ${latest.drawAt}`,
      `- Published: ${latest.publishedAt}`,
      `- Total: ${latest.total} | Flower: ${latest.flower ?? '—'}`,
    );
  } else {
    lines.push('_No latest draw._');
  }

  lines.push(
    '',
    '---',
    '',
    '## Integrity',
    '',
    `Duplicate count: ${analysis.duplicateCount}`,
    `Gap detection: ${analysis.gapCount} gap(s)`,
  );
  if (analysis.gapSamples.length > 0) {
    lines.push('', 'Sample gaps:');
    for (const sample of analysis.gapSamples) {
      lines.push(`- ${sample}`);
    }
  }

  lines.push(
    '',
    `Average publish delay: ${Math.round(analysis.averagePublishDelayMs)} ms`,
    `API failures (collector): ${failures}`,
    '',
    '---',
    '',
    '## Collector health',
    '',
    status,
  );

  if (apiError) {
    lines.push('', `API error: ${apiError}`);
  }

  lines.push('', '---', '', '## Statistics', '', ...formatStatisticsSection(recentDraws));
  lines.push('', '---', '', '## Notifications', '', ...formatNotificationSection());
  lines.push('', '---', '', '## Performance', '', ...formatPerformanceSection());

  const path = join(REPORTS_DIR, 'soak-report.md');
  writeMarkdown(path, lines.join('\n'));
  return { path, status };
}

async function main(): Promise<void> {
  const { path, status } = await generateSoakReport();
  console.log(`Soak report → ${path}`);
  console.log(`Collector health: ${status}`);
  process.exit(status === 'PASS' ? 0 : 1);
}

void main();
