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

  it('search-policy/ contains no runtime public API imports', () => {
    const policyFiles = files.filter((file) => file.includes('search-policy'));
    for (const file of policyFiles) {
      const content = readFileSync(file, 'utf-8');
      expect(content).not.toMatch(
        /validateCalculationRequest|solve\(|buildStrategy|buildStatistics|from '@\/public'/,
      );
    }
  });

  describe('engine delegates movement to SearchPolicy (Sprint 3.2B)', () => {
    const optimizeContent = readFileSync(join(OPT_DIR, 'optimize.ts'), 'utf-8');

    it('optimize.ts uses policy.nextProfit for profit steps', () => {
      expect(optimizeContent).toMatch(/policy\.nextProfit/);
      expect(optimizeContent).toMatch(/defaultSearchPolicy/);
    });

    it('optimize.ts does not inline profit decrement', () => {
      expect(optimizeContent).not.toMatch(/currentProfit\s*-\s*profitGranularity/);
      expect(optimizeContent).not.toMatch(/profitGranularity\s*-/);
      expect(optimizeContent).not.toMatch(/-=\s*profitGranularity/);
      expect(optimizeContent).not.toMatch(/targetProfit\.amount\s*-/);
    });

    it('optimize.ts does not inline round decrement before 3.2C', () => {
      expect(optimizeContent).not.toMatch(/policy\.nextRoundCount/);
      expect(optimizeContent).not.toMatch(/roundCount\s*-\s*1/);
      expect(optimizeContent).not.toMatch(/currentRoundCount\s*-/);
    });
  });
});
