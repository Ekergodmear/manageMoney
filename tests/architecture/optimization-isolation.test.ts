import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '../..');
const OPT_DIR = join(ROOT, 'src/core/optimization');

const FORBIDDEN_CORE_IMPORTS = [
  '@/core/solver',
  '@/core/validation',
  '@/core/strategy-builder',
  '@/core/statistics-builder',
  '@/core/simulation',
  '/solver/',
  '/validation/',
  '/strategy-builder/',
  '/statistics-builder/',
  '/simulation/',
];

const PUBLIC_CAPABILITY_IMPORTS = [
  'validateCalculationRequest',
  'solve',
  'buildStrategy',
  'buildStatistics',
  'simulateWinAtRound',
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

describe('Architecture — OptimizationEngine isolation', () => {
  const files = collectTsFiles(OPT_DIR);

  it.each(files)('%s must not deep-import other core modules', (file) => {
    const content = readFileSync(file, 'utf-8');
    for (const forbidden of FORBIDDEN_CORE_IMPORTS) {
      expect(content.includes(forbidden)).toBe(false);
    }
  });

  it('optimize.ts imports capabilities from @/public only', () => {
    const content = readFileSync(join(OPT_DIR, 'optimize.ts'), 'utf-8');
    expect(content).toMatch(/from '@\/public'/);

    for (const capability of PUBLIC_CAPABILITY_IMPORTS) {
      if (content.includes(capability)) {
        expect(content).not.toMatch(new RegExp(`from ['"]@/core/[^'"]+['"].*${capability}`));
      }
    }
  });

  it('models/ contain no runtime public API imports', () => {
    const modelFiles = files.filter((file) => file.includes('optimization/models'));
    for (const file of modelFiles) {
      const content = readFileSync(file, 'utf-8');
      expect(content).not.toMatch(
        /validateCalculationRequest|solve\(|buildStrategy|buildStatistics/,
      );
    }
  });
});
