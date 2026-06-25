/**
 * Verifies path aliases: runtime via Vitest, @/core/* via tsconfig contract.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import breakEvenFixture from '@/tests/fixtures/break-even-x20-5-rounds.json';
import { TESTS_SMOKE } from '@/tests/smoke/core-alias';

const ROOT = join(import.meta.dirname, '../..');

describe('Architecture — alias resolution', () => {
  it('resolves @/tests/* at runtime (Vitest + vite-tsconfig-paths)', () => {
    expect(breakEvenFixture.input.rewardMultiplier).toBe(20);
    expect(breakEvenFixture.input.profitMode).toBe('break-even');
    expect(TESTS_SMOKE).toBe(true);
  });

  it('defines @/core/* in tsconfig paths (single source of truth)', () => {
    const tsconfig = JSON.parse(readFileSync(join(ROOT, 'tsconfig.json'), 'utf-8')) as {
      compilerOptions: { paths: Record<string, string[]> };
    };
    expect(tsconfig.compilerOptions.paths['@/core/*']).toEqual(['src/core/*']);
  });
});
