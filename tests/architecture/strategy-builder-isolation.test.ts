import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '../..');
const BUILDER_DIR = join(ROOT, 'src/core/strategy-builder');
const CORE_DIR = join(ROOT, 'src/core');

const FORBIDDEN_IMPORTS = [
  '@/core/solver',
  '@/core/validation',
  '@/core/statistics-builder',
  '@/core/simulation',
  '@/core/optimization',
  '/solver/',
  '/validation/',
  '/statistics-builder/',
  '/simulation/',
  '/optimization/',
];

const GRANDFATHERED_STRATEGY_CONSTRUCTORS = ['src/core/solver'];

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

function relativeCorePath(file: string): string {
  return file.replace(/\\/g, '/').slice(CORE_DIR.length + 1);
}

describe('Architecture — StrategyBuilder isolation', () => {
  const files = collectTsFiles(BUILDER_DIR);

  it.each(files)(
    '%s must not import solver/validation/statistics/simulation/optimization',
    (file) => {
      const content = readFileSync(file, 'utf-8');
      for (const forbidden of FORBIDDEN_IMPORTS) {
        expect(content.includes(forbidden)).toBe(false);
      }
    },
  );

  it('exports buildStrategy from index', () => {
    const content = readFileSync(join(BUILDER_DIR, 'index.ts'), 'utf-8');
    expect(content).toContain('buildStrategy');
  });
});

describe('Architecture — Strategy canonical constructor (ADR-034)', () => {
  const coreFiles = collectTsFiles(CORE_DIR).filter((file) => {
    const rel = `src/core/${relativeCorePath(file)}`;
    if (rel.startsWith('src/core/strategy-builder/')) {
      return false;
    }
    if (GRANDFATHERED_STRATEGY_CONSTRUCTORS.some((prefix) => rel.startsWith(prefix))) {
      return false;
    }
    return true;
  });

  it.each(coreFiles)('%s must not construct Strategy via { rounds }', (file) => {
    const content = readFileSync(file, 'utf-8');
    expect(content.includes('return { rounds')).toBe(false);
    expect(content.includes('return {rounds')).toBe(false);
  });
});
