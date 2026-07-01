import { DEFAULT_RETRY_POLICY } from '../retry/retry-policy.js';
import type { RetryObservabilitySnapshot } from '../retry/retry-state.js';
import type { CollectorState } from '../types/collector-state.js';
import {
  normalizeDiagnosisCause,
  type DiagnosisCause,
} from '../diagnostics/diagnosis-cause.js';
import type { LastFailureView, OperationalHealthStatus } from '../diagnostics/types.js';

export function resolveActiveDiagnosis(
  state: CollectorState,
  retry: RetryObservabilitySnapshot,
  operationalStatus: OperationalHealthStatus,
  overrideCause: DiagnosisCause | null = null,
): DiagnosisCause | null {
  if (overrideCause !== null) {
    return overrideCause;
  }
  if (operationalStatus === 'healthy') {
    return null;
  }
  const fromRetry = normalizeDiagnosisCause(retry.lastErrorType);
  if (fromRetry !== null) {
    return fromRetry;
  }
  if (state.failureCount > 0 && state.status === 'degraded') {
    return 'unknown';
  }
  if (state.status === 'stopped') {
    return 'unknown';
  }
  return null;
}

export function buildLastFailureView(
  retry: RetryObservabilitySnapshot,
  diagnosis: DiagnosisCause | null,
): LastFailureView | null {
  if (diagnosis === null) {
    return null;
  }

  const at = retry.lastRetryAt ?? new Date(0).toISOString();
  const durationMs =
    diagnosis === 'timeout' ? DEFAULT_RETRY_POLICY.requestTimeoutMs : null;

  return {
    cause: diagnosis,
    at,
    retryAttempt: Math.max(retry.retryCount, 1),
    retryMax: DEFAULT_RETRY_POLICY.maxAttempts,
    durationMs,
  };
}
