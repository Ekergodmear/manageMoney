import type { CollectorState } from '../types/collector-state.js';

export type HealthStatus = 'healthy' | 'unhealthy';

export interface CollectorHealth {
  readonly status: CollectorState['status'];
  readonly lastPollAt: string | null;
  readonly lastSuccessAt: string | null;
  readonly averageLatencyMs: number;
  readonly failureCount: number;
  readonly activeAdapterId: string;
  readonly drawCount: number;
  readonly lastDrawNumber: string | null;
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
): CollectorHealth {
  return {
    status: state.status,
    lastPollAt: state.lastPollAt,
    lastSuccessAt: state.lastSuccessAt,
    averageLatencyMs: state.averageLatencyMs,
    failureCount: state.failureCount,
    activeAdapterId: adapterId,
    drawCount,
    lastDrawNumber: state.lastDraw?.drawNumber ?? null,
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
    detail: `${health.drawCount} draws stored`,
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
    name: 'Last Draw',
    ok: health.lastDrawNumber !== null,
    detail: health.lastDrawNumber ?? 'none',
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
  lines.push(`Draws in SQLite: ${report.health.drawCount}`);
  lines.push(`Last Draw: ${report.health.lastDrawNumber ?? 'none'}`);
  lines.push(`Last Poll: ${report.health.lastPollAt ?? 'never'}`);
  lines.push(`Last Success: ${report.health.lastSuccessAt ?? 'never'}`);
  lines.push(`Average Latency: ${Math.round(report.health.averageLatencyMs / 1000)}s`);
  lines.push(`Failure Count: ${report.health.failureCount}`);
  lines.push('');
  lines.push('Checks:');
  for (const check of report.checks) {
    lines.push(`  [${check.ok ? 'OK' : 'FAIL'}] ${check.name}: ${check.detail}`);
  }

  return lines.join('\n');
}
