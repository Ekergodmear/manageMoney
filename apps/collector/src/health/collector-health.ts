import type { CollectorState, ResumeState } from '../types/collector-state.js';
import type { DrawResult } from '../types/draw-result.js';
import { loadRetryObservabilitySnapshot } from '../retry/retry-state.js';
import { formatResumeStateLabel } from '../resume/resume-state.js';
import { formatRetryObservabilityLines } from './retry-observability.js';

export type HealthStatus = 'healthy' | 'unhealthy';

export interface CollectorHealth {
  readonly status: CollectorState['status'];
  readonly lastPollAt: string | null;
  readonly lastSuccessAt: string | null;
  readonly averageLatencyMs: number;
  readonly failureCount: number;
  readonly duplicatesSkipped: number;
  readonly resumeState: ResumeState;
  readonly catchUpCount: number;
  readonly resumedFromDrawKey: string | null;
  readonly activeAdapterId: string;
  readonly drawCount: number;
  readonly lastDrawKey: string | null;
  readonly latestDraw: DrawResult | null;
}

export interface HealthReport {
  readonly health: CollectorHealth;
  readonly overall: HealthStatus;
  readonly checks: readonly HealthCheck[];
}

export interface HealthCheck {
  readonly name: string;
  readonly ok: boolean;
  readonly detail: string;
}

export function buildCollectorHealth(
  state: CollectorState,
  adapterId: string,
  drawCount: number,
  latestDraw: DrawResult | null,
): CollectorHealth {
  return {
    status: state.status,
    lastPollAt: state.lastPollAt,
    lastSuccessAt: state.lastSuccessAt,
    averageLatencyMs: state.averageLatencyMs,
    failureCount: state.failureCount,
    duplicatesSkipped: state.duplicatesSkipped,
    resumeState: state.resumeState,
    catchUpCount: state.catchUpCount,
    resumedFromDrawKey: state.resumedFromDrawKey,
    activeAdapterId: adapterId,
    drawCount,
    lastDrawKey: state.lastDrawKey ?? latestDraw?.drawKey ?? null,
    latestDraw: latestDraw ?? state.lastDraw,
  };
}

export function assessHealth(
  health: CollectorHealth,
  options?: { maxFailureCount?: number; staleSuccessMs?: number },
): HealthReport {
  const maxFailures = options?.maxFailureCount ?? 10;
  const staleMs = options?.staleSuccessMs ?? 15 * 60_000;

  const checks: HealthCheck[] = [];

  checks.push({
    name: 'Adapter',
    ok: health.activeAdapterId.length > 0,
    detail: health.activeAdapterId || 'none',
  });

  checks.push({
    name: 'SQLite',
    ok: true,
    detail: `${String(health.drawCount)} draws stored`,
  });

  checks.push({
    name: 'Failure Count',
    ok: health.failureCount < maxFailures,
    detail: String(health.failureCount),
  });

  const lastSuccessAge =
    health.lastSuccessAt === null
      ? Infinity
      : Date.now() - new Date(health.lastSuccessAt).getTime();

  checks.push({
    name: 'Last Success',
    ok: health.lastSuccessAt !== null && lastSuccessAge < staleMs,
    detail: health.lastSuccessAt ?? 'never',
  });

  checks.push({
    name: 'Last Draw Key',
    ok: health.lastDrawKey !== null,
    detail: health.lastDrawKey ?? 'none',
  });

  const overall: HealthStatus = checks.every((c) => c.ok) ? 'healthy' : 'unhealthy';

  return { health, overall, checks };
}

export function formatHealthReport(report: HealthReport): string {
  const lines: string[] = ['Collector Health', ''];

  const statusIcon = report.overall === 'healthy' ? 'OK' : 'UNHEALTHY';
  lines.push(`Overall: ${statusIcon}`);
  lines.push(`Status: ${report.health.status}`);
  lines.push(`Adapter: ${report.health.activeAdapterId}`);
  lines.push(`Draws in SQLite: ${String(report.health.drawCount)}`);
  lines.push(`Latest Draw Key: ${report.health.lastDrawKey ?? 'none'}`);

  const draw = report.health.latestDraw;
  if (draw !== null) {
    lines.push(`Draw At: ${draw.drawAt}`);
    lines.push(`Published At: ${draw.publishedAt}`);
    lines.push(`Collected At: ${draw.collectedAt}`);
    lines.push(`Estimated Publish: ${draw.publishedEstimated ? 'Yes' : 'No'}`);
  }

  lines.push(`Last Poll: ${report.health.lastPollAt ?? 'never'}`);
  lines.push(`Last Success: ${report.health.lastSuccessAt ?? 'never'}`);
  lines.push(
    `Average Latency: ${String(Math.round(report.health.averageLatencyMs / 1000))}s`,
  );
  lines.push(`Failure Count: ${String(report.health.failureCount)}`);
  lines.push(`Duplicates Skipped: ${String(report.health.duplicatesSkipped)}`);
  lines.push(`Resume State: ${formatResumeStateLabel(report.health.resumeState)}`);
  if (report.health.resumedFromDrawKey !== null) {
    lines.push(`Resumed From: ${report.health.resumedFromDrawKey}`);
  }
  lines.push(`Catch-up Count: ${String(report.health.catchUpCount)}`);
  lines.push('');
  lines.push('Retry:');
  for (const line of formatRetryObservabilityLines(loadRetryObservabilitySnapshot())) {
    lines.push(`  ${line}`);
  }
  lines.push('');
  lines.push('Checks:');
  for (const check of report.checks) {
    lines.push(`  [${check.ok ? 'OK' : 'FAIL'}] ${check.name}: ${check.detail}`);
  }

  return lines.join('\n');
}
