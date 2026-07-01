import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchJsonWithTimeout } from '../src/adapter/fetch-json.js';
import { classifyFetchError, CollectorRequestError } from '../src/retry/retry-errors.js';
import {
  DEFAULT_RETRY_POLICY,
  executeWithRetry,
  retryDelayMs,
} from '../src/retry/retry-policy.js';
import {
  loadRetryObservabilitySnapshot,
  resetRetryObservabilityForTests,
} from '../src/retry/retry-state.js';
import { formatHealthReport, assessHealth, buildCollectorHealth } from '../src/health/collector-health.js';
import { initialCollectorState } from '../src/types/collector-state.js';
import { Bingo18DrawSourceAdapter } from '../src/adapter/bingo18-adapter.js';

const RETRY_STATE_PATH = './data/retry-state.test.json';

describe('retry policy', () => {
  beforeEach(() => {
    process.env['COLLECTOR_RETRY_STATE_PATH'] = RETRY_STATE_PATH;
    resetRetryObservabilityForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('succeeds on first attempt', async () => {
    const fn = vi.fn(async () => 'ok');
    await expect(executeWithRetry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('succeeds on second attempt after one failure', async () => {
    vi.useFakeTimers();
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts += 1;
      if (attempts < 2) {
        throw new CollectorRequestError('network', 'temporary');
      }
      return 'ok';
    });

    const promise = executeWithRetry(fn, { baseDelayMs: 1_000 });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);

    const snapshot = loadRetryObservabilitySnapshot();
    expect(snapshot.retryCount).toBe(1);
    expect(snapshot.lastErrorType).toBeNull();
    expect(snapshot.lastSuccessAt).not.toBeNull();
  });

  it('fails after three attempts with exponential backoff delays', async () => {
    expect(retryDelayMs(1)).toBe(1_000);
    expect(retryDelayMs(2)).toBe(2_000);
    expect(retryDelayMs(3)).toBe(4_000);

    vi.useFakeTimers();
    const fn = vi.fn(async () => {
      throw new CollectorRequestError('network', 'down');
    });

    const promise = executeWithRetry(fn, { maxAttempts: 3, baseDelayMs: 1_000 });
    const rejection = expect(promise).rejects.toThrow('down');
    await vi.runAllTimersAsync();
    await rejection;
    expect(fn).toHaveBeenCalledTimes(3);

    const snapshot = loadRetryObservabilitySnapshot();
    expect(snapshot.retryCount).toBe(2);
    expect(snapshot.lastErrorType).toBe('network');
  });

  it('classifies timeout, http 500, and parse errors distinctly', async () => {
    const timeoutError = classifyFetchError(
      Object.assign(new Error('Aborted'), { name: 'AbortError' }),
    );
    expect(timeoutError.errorType).toBe('timeout');

    const httpError = classifyFetchError(new CollectorRequestError('http_error', 'HTTP 500'));
    expect(httpError.errorType).toBe('http_error');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'fail',
        headers: new Headers(),
      })),
    );
    await expect(
      fetchJsonWithTimeout('https://example.test', (text) => JSON.parse(text) as unknown, 10_000),
    ).rejects.toMatchObject({ errorType: 'http_error' });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '{not-json',
        headers: new Headers(),
      })),
    );
    await expect(
      fetchJsonWithTimeout('https://example.test', (text) => JSON.parse(text) as unknown, 10_000),
    ).rejects.toMatchObject({ errorType: 'parse_error' });
  });

  it('returns one fetch result after retry without duplicate adapter payloads', async () => {
    const payload = {
      gbingoDraws: [{ drawAt: '2026-06-30T10:00:00+07:00', winningResult: '1-2-3' }],
    };
    let attempts = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        attempts += 1;
        if (attempts < 2) {
          throw new Error('network down');
        }
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          text: async () => JSON.stringify(payload),
          headers: new Headers(),
        };
      }),
    );

    const adapter = new Bingo18DrawSourceAdapter({
      apiUrl: 'https://example.test/data.json',
      timeoutMs: 10_000,
    });

    const first = await adapter.fetchLatest();
    const second = await adapter.fetchLatest();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first?.rawPayload.kind).toBe('bingo18-list');
    expect(second?.rawPayload.kind).toBe('bingo18-list');
    if (first?.rawPayload.kind === 'bingo18-list' && second?.rawPayload.kind === 'bingo18-list') {
      expect(first.rawPayload.draws).toEqual(second.rawPayload.draws);
    }
    expect(attempts).toBeGreaterThanOrEqual(2);
  });

  it('surfaces retry state in doctor health report', async () => {
    vi.useFakeTimers();
    const fn = vi.fn(async () => {
      throw new CollectorRequestError('network', 'down');
    });
    const promise = executeWithRetry(fn, { maxAttempts: 2, baseDelayMs: 1 });
    const rejection = expect(promise).rejects.toThrow('down');
    await vi.runAllTimersAsync();
    await rejection;

    const health = buildCollectorHealth(initialCollectorState(), 'bingo18', 0, null);
    const report = assessHealth(health);
    const text = formatHealthReport(report);
    expect(text).toContain('Retry Count: 1');
    expect(text).toContain('Last Retry:');
    expect(text).toContain('Last Error Type: network');
    expect(text).toContain('Last Success:');
  });

  it('uses default policy constants', () => {
    expect(DEFAULT_RETRY_POLICY.maxAttempts).toBe(3);
    expect(DEFAULT_RETRY_POLICY.baseDelayMs).toBe(1_000);
    expect(DEFAULT_RETRY_POLICY.requestTimeoutMs).toBe(10_000);
  });
});
