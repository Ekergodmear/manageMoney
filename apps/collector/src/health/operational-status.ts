import type { RetryObservabilitySnapshot } from '../retry/retry-state.js';
import type { CollectorState } from '../types/collector-state.js';
import type { OperationalHealthStatus } from '../diagnostics/types.js';

export interface OperationalStatusOptions {
  readonly maxFailureCount?: number;
  readonly staleSuccessMs?: number;
  readonly offlinePollMs?: number;
}

const DEFAULT_OFFLINE_POLL_MS = 5 * 60_000;

export function deriveOperationalStatus(
  state: CollectorState,
  retry: RetryObservabilitySnapshot,
  now: number,
  options: OperationalStatusOptions = {},
): OperationalHealthStatus {
  const maxFailures = options.maxFailureCount ?? 10;
  const staleMs = options.staleSuccessMs ?? 15 * 60_000;
  const offlinePollMs = options.offlinePollMs ?? DEFAULT_OFFLINE_POLL_MS;

  if (state.status === 'stopped') {
    return 'offline';
  }

  const pollAge =
    state.lastPollAt === null ? Infinity : now - new Date(state.lastPollAt).getTime();
  if (state.status === 'running' && pollAge > offlinePollMs) {
    return 'offline';
  }

  if (state.status === 'degraded' || state.failureCount >= maxFailures) {
    return 'degraded';
  }

  const successAge =
    state.lastSuccessAt === null ? Infinity : now - new Date(state.lastSuccessAt).getTime();
  if (state.lastSuccessAt === null || successAge >= staleMs) {
    return 'degraded';
  }

  if (
    retry.lastErrorType !== null &&
    retry.lastRetryAt !== null &&
    (retry.lastSuccessAt === null ||
      new Date(retry.lastRetryAt).getTime() > new Date(retry.lastSuccessAt).getTime())
  ) {
    return 'degraded';
  }

  if (state.lastDrawKey === null) {
    return 'degraded';
  }

  return 'healthy';
}

export function formatOperationalStatus(status: OperationalHealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'degraded':
      return 'Degraded';
    case 'offline':
      return 'Offline';
  }
}
