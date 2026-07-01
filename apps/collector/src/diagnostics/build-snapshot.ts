import { buildFreshnessView } from '../health/freshness.js';
import { buildLastFailureView, resolveActiveDiagnosis } from '../health/last-failure.js';
import {
  deriveOperationalStatus,
  formatOperationalStatus,
} from '../health/operational-status.js';
import { formatResumeStateLabel } from '../resume/resume-state.js';
import type { RetryObservabilitySnapshot } from '../retry/retry-state.js';
import { loadRetryObservabilitySnapshot } from '../retry/retry-state.js';
import type { CollectorState } from '../types/collector-state.js';
import type { DrawResult } from '../types/draw-result.js';
import type { DiagnosisCause } from './diagnosis-cause.js';
import type { CollectorHealthSnapshot } from './types.js';

export interface BuildSnapshotInput {
  readonly state: CollectorState;
  readonly adapterId: string;
  readonly drawCount: number;
  readonly latestDraw: DrawResult | null;
  readonly retry?: RetryObservabilitySnapshot;
  readonly now?: number;
  readonly diagnosisOverride?: DiagnosisCause | null;
}

function formatClockTime(iso: string | null): string | null {
  if (iso === null) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function formatAdapterLabel(adapterId: string): string {
  if (adapterId.length === 0) return 'none';
  return adapterId.charAt(0).toUpperCase() + adapterId.slice(1);
}

export function buildCollectorHealthSnapshot(input: BuildSnapshotInput): CollectorHealthSnapshot {
  const now = input.now ?? Date.now();
  const retry = input.retry ?? loadRetryObservabilitySnapshot();
  const operationalStatus = deriveOperationalStatus(input.state, retry, now);
  const diagnosis = resolveActiveDiagnosis(
    input.state,
    retry,
    operationalStatus,
    input.diagnosisOverride ?? null,
  );
  const lastFailure = buildLastFailureView(retry, diagnosis);
  const freshness = buildFreshnessView(input.latestDraw, now);

  return {
    status: operationalStatus,
    diagnosis,
    summary: {
      status: operationalStatus,
      adapter: formatAdapterLabel(input.adapterId),
      lastSuccess: formatClockTime(input.state.lastSuccessAt),
      lastPoll: formatClockTime(input.state.lastPollAt),
      latestDraw: input.state.lastDrawKey ?? input.latestDraw?.drawKey ?? null,
      resumeState: formatResumeStateLabel(input.state.resumeState),
      retryCount: retry.retryCount,
      catchUpCount: input.state.catchUpCount,
      duplicatesSkipped: input.state.duplicatesSkipped,
    },
    details: {
      drawCount: input.drawCount,
      failureCount: input.state.failureCount,
      resumedFromDrawKey: input.state.resumedFromDrawKey,
      averageLatencyMs: input.state.averageLatencyMs,
      runtimeStatus: input.state.status,
    },
    lastFailure,
    freshness,
  };
}

export function snapshotStatusLabel(snapshot: CollectorHealthSnapshot): string {
  return formatOperationalStatus(snapshot.status);
}
