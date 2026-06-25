import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '../..');
const STATS_DIR = join(ROOT, 'src/core/statistics-builder');
const CORE_DIR = join(ROOT, 'src/core');

const FORBIDDEN_IMPORTS = [
  '@/core/solver',
  '@/core/validation',
  '@/core/strategy-builder',
  '@/core/simulation',
  '@/core/optimization',
  '/solver/',
  '/validation/',
  '/strategy-builder/',
  '/simulation/',
  '/optimization/',
];

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

describe('Architecture — StatisticsBuilder isolation', () => {
  const files = collectTsFiles(STATS_DIR);

  it.each(files)(
    '%s must not import solver/validation/strategy-builder/simulation/optimization',
    (file) => {
      const content = readFileSync(file, 'utf-8');
      for (const forbidden of FORBIDDEN_IMPORTS) {
        expect(content.includes(forbidden)).toBe(false);
      }
    },
  );

  it('exports buildStatistics from index', () => {
    const content = readFileSync(join(STATS_DIR, 'index.ts'), 'utf-8');
    expect(content).toContain('buildStatistics');
  });
});

describe('Architecture — StrategyStatistics canonical constructor (ADR-035)', () => {
  const coreFiles = collectTsFiles(CORE_DIR).filter((file) => {
    const rel = `src/core/${relativeCorePath(file)}`;
    if (rel.startsWith('src/core/statistics-builder/')) {
      return false;
    }
    if (rel.startsWith('src/core/simulation/')) {
      return false;
    }
    if (rel.startsWith('src/core/models/')) {
      return false;
    }
    if (rel.startsWith('src/core/optimization/')) {
      return false;
    }
    return true;
  });

  it.each(coreFiles)('%s must not construct StrategyStatistics object literals', (file) => {
    const content = readFileSync(file, 'utf-8');
    expect(content.includes('roundCount:')).toBe(false);
    expect(content.includes('requiredBankrollAmount:')).toBe(false);
    expect(content.includes('expectedProfitAmount:')).toBe(false);
  });
});
