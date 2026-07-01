/**
 * After adapter retries are exhausted, fetchLatest() returns null
 * and the collector poll loop (scheduler) applies its own backoff.
 */
export const ADAPTER_RETRY_EXHAUSTED = 'adapter-null-handoff' as const;
