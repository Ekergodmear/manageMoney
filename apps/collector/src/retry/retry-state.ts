import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import type { RetryErrorType } from './retry-errors.js';

function parseRetryErrorType(value: string): RetryErrorType | null {
  switch (value) {
    case 'timeout':
    case 'http_error':
    case 'parse_error':
    case 'network':
    case 'unknown':
      return value;
    default:
      return null;
  }
}

export interface RetryObservabilitySnapshot {
  readonly retryCount: number;
  readonly lastRetryAt: string | null;
  readonly lastErrorType: RetryErrorType | null;
  readonly lastSuccessAt: string | null;
}

const EMPTY_SNAPSHOT: RetryObservabilitySnapshot = {
  retryCount: 0,
  lastRetryAt: null,
  lastErrorType: null,
  lastSuccessAt: null,
};

function statePath(): string {
  return process.env['COLLECTOR_RETRY_STATE_PATH'] ?? './data/retry-state.json';
}

function readSnapshot(): RetryObservabilitySnapshot {
  try {
    const raw = readFileSync(statePath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<RetryObservabilitySnapshot>;
    return {
      retryCount: typeof parsed.retryCount === 'number' ? parsed.retryCount : 0,
      lastRetryAt: typeof parsed.lastRetryAt === 'string' ? parsed.lastRetryAt : null,
      lastErrorType:
        typeof parsed.lastErrorType === 'string'
          ? parseRetryErrorType(parsed.lastErrorType)
          : null,
      lastSuccessAt: typeof parsed.lastSuccessAt === 'string' ? parsed.lastSuccessAt : null,
    };
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function writeSnapshot(snapshot: RetryObservabilitySnapshot): void {
  const path = statePath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
}

export function loadRetryObservabilitySnapshot(): RetryObservabilitySnapshot {
  return readSnapshot();
}

export function resetRetryObservabilityForTests(): void {
  writeSnapshot(EMPTY_SNAPSHOT);
}

export function recordRetryAttempt(errorType: RetryErrorType): void {
  const current = readSnapshot();
  writeSnapshot({
    retryCount: current.retryCount + 1,
    lastRetryAt: new Date().toISOString(),
    lastErrorType: errorType,
    lastSuccessAt: current.lastSuccessAt,
  });
}

export function recordRetrySuccess(): void {
  const current = readSnapshot();
  writeSnapshot({
    ...current,
    lastSuccessAt: new Date().toISOString(),
    lastErrorType: null,
  });
}

export function recordRetryExhausted(errorType: RetryErrorType): void {
  const current = readSnapshot();
  writeSnapshot({
    ...current,
    lastErrorType: errorType,
  });
}
