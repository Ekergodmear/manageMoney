import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '../..');
const SOLVER_DIR = join(ROOT, 'src/core/solver');

const FORBIDDEN_IMPORTS = [
  '@/core/validation',
  '@/core/strategy-builder',
  '@/core/statistics-builder',
  '@/core/simulation',
  '@/core/optimization',
  'strategy-builder',
  '/validation/',
  '/simulation/',
  '/optimization/',
];

const FORBIDDEN_HOT_PATH = ['.forEach(', '.map(', '.reduce('];

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('Architecture — ConstraintSolver isolation', () => {
  const files = collectTsFiles(SOLVER_DIR);

  it.each(files)(
    '%s must not import validation/strategy-builder/simulation/optimization',
    (file) => {
      const content = readFileSync(file, 'utf-8');
      for (const forbidden of FORBIDDEN_IMPORTS) {
        expect(content.includes(forbidden)).toBe(false);
      }
    },
  );

  it('solve.ts must not use forEach/map/reduce on hot path', () => {
    const content = readFileSync(join(SOLVER_DIR, 'solve.ts'), 'utf-8');
    for (const forbidden of FORBIDDEN_HOT_PATH) {
      expect(content.includes(forbidden)).toBe(false);
    }
  });
});
