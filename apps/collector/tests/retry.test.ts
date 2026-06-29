import { describe, expect, it, vi } from 'vitest';

import { withRetry, withSqliteRetry } from '../src/util/retry.js';

describe('withRetry', () => {
  it('retries then succeeds', async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('fail');
      return 'ok';
    }, { maxAttempts: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('throws after max attempts', async () => {
    await expect(
      withRetry(async () => {
        throw new Error('always');
      }, { maxAttempts: 2, baseDelayMs: 1 }),
    ).rejects.toThrow('always');
  });
});

describe('withSqliteRetry', () => {
  it('retries on SQLITE_BUSY', async () => {
    let attempts = 0;
    const result = await withSqliteRetry(() => {
      attempts += 1;
      if (attempts < 2) {
        const err = new Error('busy') as Error & { code: string };
        err.code = 'SQLITE_BUSY';
        throw err;
      }
      return 42;
    });
    expect(result).toBe(42);
    expect(attempts).toBe(2);
  });
});
