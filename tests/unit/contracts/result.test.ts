import { describe, expect, it } from 'vitest';

import { failure, success } from '@/core/contracts';
import type { Result } from '@/core/contracts';

describe('Result', () => {
  it('success wraps value with kind success', () => {
    const result = success(42);
    expect(result).toEqual({ kind: 'success', value: 42 });
  });

  it('failure wraps error with kind failure', () => {
    const result = failure({ code: 'ERR' });
    expect(result).toEqual({ kind: 'failure', error: { code: 'ERR' } });
  });

  it('narrows via kind discriminant on union', () => {
    const results: Result<number, string>[] = [success(10), failure('err'), success(5)];

    const values = results.flatMap((result) => {
      if (result.kind === 'success') {
        return [result.value];
      }
      return [];
    });

    expect(values).toEqual([10, 5]);
  });
});
