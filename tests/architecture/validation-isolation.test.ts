import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '../..');
const VALIDATION_DIR = join(ROOT, 'src/core/validation');

const FORBIDDEN_IMPORTS = [
  '@/core/solver',
  '@/core/strategy-builder',
  '@/core/simulation',
  '@/core/optimization',
  'strategy-builder',
  '/solver/',
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

describe('Architecture — ValidationEngine isolation', () => {
  const files = collectTsFiles(VALIDATION_DIR);

  it.each(files)('%s must not import solver/strategy/simulation/optimization', (file) => {
    const content = readFileSync(file, 'utf-8');
    for (const forbidden of FORBIDDEN_IMPORTS) {
      expect(content.includes(forbidden)).toBe(false);
    }
  });
});
