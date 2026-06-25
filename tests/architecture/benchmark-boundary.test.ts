/**
 * Architecture — benchmark files import public API only.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '../..');
const BENCH_DIR = join(ROOT, 'benchmarks');

const ALLOWED_SPECIFIERS = ['@stake/constraint-engine', './', '../'] as const;

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectTsFiles(full));
    } else if (entry.endsWith('.ts') && entry !== 'run.ts') {
      files.push(full);
    }
  }
  return files;
}

function extractImports(source: string): string[] {
  const imports: string[] = [];
  const regex = /from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    const specifier = match[1];
    if (specifier) imports.push(specifier);
  }
  return imports;
}

describe('Architecture — benchmark boundary', () => {
  it('benchmark modules only import public API or relative paths', () => {
    const violations: string[] = [];

    for (const file of collectTsFiles(BENCH_DIR)) {
      const relativeFile = file.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, '');
      const source = readFileSync(file, 'utf-8');
      for (const specifier of extractImports(source)) {
        if (specifier.startsWith('.') || specifier.startsWith('node:')) continue;

        const allowed = ALLOWED_SPECIFIERS.some((prefix) => specifier.startsWith(prefix));
        if (!allowed) {
          violations.push(`${relativeFile} → ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('does not import core implementation paths', () => {
    const forbidden = ['@/core/', '@/application/', 'integer-math', 'resolve-target'];
    const violations: string[] = [];

    for (const file of collectTsFiles(BENCH_DIR)) {
      const relativeFile = file.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, '');
      const source = readFileSync(file, 'utf-8');
      for (const fragment of forbidden) {
        if (source.includes(fragment)) {
          violations.push(`${relativeFile} contains ${fragment}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
