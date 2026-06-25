import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '../..');
const SIM_DIR = join(ROOT, 'src/core/simulation');
const CORE_DIR = join(ROOT, 'src/core');

const FORBIDDEN_IMPORTS = [
  '@/core/solver',
  '@/core/validation',
  '@/core/strategy-builder',
  '@/core/statistics-builder',
  '@/core/optimization',
  '/solver/',
  '/validation/',
  '/strategy-builder/',
  '/statistics-builder/',
  '/optimization/',
  'StrategyStatistics',
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

describe('Architecture — SimulationEngine isolation (T12)', () => {
  const files = collectTsFiles(SIM_DIR);

  it.each(files)(
    '%s must not import solver/validation/builders/statistics/optimization',
    (file) => {
      const content = readFileSync(file, 'utf-8');
      for (const forbidden of FORBIDDEN_IMPORTS) {
        expect(content.includes(forbidden)).toBe(false);
      }
    },
  );

  it('exports simulateWinAtRound from index', () => {
    const content = readFileSync(join(SIM_DIR, 'index.ts'), 'utf-8');
    expect(content).toContain('simulateWinAtRound');
  });
});

describe('Architecture — SimulationResult canonical constructor (ADR-036)', () => {
  const coreFiles = collectTsFiles(CORE_DIR).filter((file) => {
    const rel = `src/core/${relativeCorePath(file)}`;
    if (rel.startsWith('src/core/simulation/')) {
      return false;
    }
    if (rel.startsWith('src/core/models/')) {
      return false;
    }
    return true;
  });

  it.each(coreFiles)('%s must not construct SimulationResult object literals', (file) => {
    const content = readFileSync(file, 'utf-8');
    expect(content.includes('winningRoundIndex:')).toBe(false);
  });
});
