import { buildCollectorHealthSnapshot } from '../diagnostics/build-snapshot.js';
import type { OperationalHealthStatus } from '../diagnostics/types.js';
import type { CollectorState, ResumeState } from '../types/collector-state.js';
import type { DrawResult } from '../types/draw-result.js';
import { loadRetryObservabilitySnapshot } from '../retry/retry-state.js';
import { formatDoctorReport } from './format-doctor-report.js';
import { deriveOperationalStatus } from './operational-status.js';

/** @deprecated Use OperationalHealthStatus from diagnostics */
export type HealthStatus = OperationalHealthStatus;

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
  readonly overall: OperationalHealthStatus;
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
  const state: CollectorState = {
    lastDrawKey: health.lastDrawKey,
    lastDraw: health.latestDraw,
    lastSuccessAt: health.lastSuccessAt,
    lastPollAt: health.lastPollAt,
    failureCount: health.failureCount,
    averageLatencyMs: health.averageLatencyMs,
    duplicatesSkipped: health.duplicatesSkipped,
    resumeState: health.resumeState,
    catchUpCount: health.catchUpCount,
    resumedFromDrawKey: health.resumedFromDrawKey,
    status: health.status,
  };
  const retry = loadRetryObservabilitySnapshot();
  const overall = deriveOperationalStatus(state, retry, Date.now(), options);

  const checks: HealthCheck[] = [
    {
      name: 'Adapter',
      ok: health.activeAdapterId.length > 0,
      detail: health.activeAdapterId || 'none',
    },
    {
      name: 'SQLite',
      ok: true,
      detail: `${String(health.drawCount)} draws stored`,
    },
    {
      name: 'Operational Status',
      ok: overall === 'healthy',
      detail: overall,
    },
  ];

  return { health, overall, checks };
}

export function formatHealthReport(report: HealthReport): string {
  const snapshot = buildCollectorHealthSnapshot({
    state: {
      lastDrawKey: report.health.lastDrawKey,
      lastDraw: report.health.latestDraw,
      lastSuccessAt: report.health.lastSuccessAt,
      lastPollAt: report.health.lastPollAt,
      failureCount: report.health.failureCount,
      averageLatencyMs: report.health.averageLatencyMs,
      duplicatesSkipped: report.health.duplicatesSkipped,
      resumeState: report.health.resumeState,
      catchUpCount: report.health.catchUpCount,
      resumedFromDrawKey: report.health.resumedFromDrawKey,
      status: report.health.status,
    },
    adapterId: report.health.activeAdapterId,
    drawCount: report.health.drawCount,
    latestDraw: report.health.latestDraw,
  });
  return formatDoctorReport(snapshot);
}

export { buildCollectorHealthSnapshot, formatDoctorReport };
