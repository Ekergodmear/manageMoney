import { classifyFetchError, type CollectorRequestError } from './retry-errors.js';
import {
  recordRetryAttempt,
  recordRetryExhausted,
  recordRetrySuccess,
} from './retry-state.js';

export interface RetryPolicyOptions {
  readonly maxAttempts?: number;
  readonly baseDelayMs?: number;
  readonly label?: string;
}

export const DEFAULT_RETRY_POLICY = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  requestTimeoutMs: 10_000,
} as const;

export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryPolicyOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_RETRY_POLICY.maxAttempts;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_RETRY_POLICY.baseDelayMs;
  let lastError: CollectorRequestError | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      recordRetrySuccess();
      return result;
    } catch (err) {
      const classified = classifyFetchError(err);
      lastError = classified;
      if (attempt === maxAttempts) {
        recordRetryExhausted(classified.errorType);
        break;
      }
      recordRetryAttempt(classified.errorType);
      const delay = baseDelayMs * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('Retry exhausted');
}

/** @deprecated Use executeWithRetry from retry/retry-policy.js */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryPolicyOptions = {}): Promise<T> {
  return executeWithRetry(fn, options);
}

export function retryDelayMs(attempt: number, baseDelayMs = DEFAULT_RETRY_POLICY.baseDelayMs): number {
  return baseDelayMs * 2 ** (attempt - 1);
}
