import type { RetryObservabilitySnapshot } from '../retry/retry-state.js';

export function formatRetryObservabilityLines(snapshot: RetryObservabilitySnapshot): string[] {
  return [
    `Retry Count: ${String(snapshot.retryCount)}`,
    `Last Retry: ${snapshot.lastRetryAt ?? 'never'}`,
    `Last Error Type: ${snapshot.lastErrorType ?? 'none'}`,
    `Last Success: ${snapshot.lastSuccessAt ?? 'never'}`,
  ];
}
