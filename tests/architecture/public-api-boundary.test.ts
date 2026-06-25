/**
 * Public API boundary — src/public may only wire from approved internal barrels.
 * @see docs/design/public-api-spec.md §6
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '../..');
const PUBLIC_DIR = join(ROOT, 'src/public');

const ALLOWED_IMPORT_PREFIXES = [
  '@/application/dto',
  '@/core/contracts',
  '@/core/models',
  '@/core/simulation',
  '@/core/solver',
  '@/core/statistics-builder',
  '@/core/strategy-builder',
  '@/core/validation',
] as const;

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectTsFiles(full));
    } else if (entry.endsWith('.ts')) {
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

describe('Architecture — public API boundary', () => {
  it('src/public exists', () => {
    expect(statSync(PUBLIC_DIR).isDirectory()).toBe(true);
  });

  it('public modules only import from approved internal barrels or relative paths', () => {
    const violations: string[] = [];

    for (const file of collectTsFiles(PUBLIC_DIR)) {
      const relativeFile = file.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, '');
      const source = readFileSync(file, 'utf-8');
      for (const specifier of extractImports(source)) {
        if (specifier.startsWith('.')) continue;

        const allowed = ALLOWED_IMPORT_PREFIXES.some(
          (prefix) => specifier === prefix || specifier.startsWith(`${prefix}/`),
        );
        if (!allowed) {
          violations.push(`${relativeFile} → ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('public modules do not import implementation-detail paths', () => {
    const forbiddenFragments = [
      '/integer-math',
      '/resolve-target',
      '/run-phase',
      '/rules/',
      '/build-validation-result',
    ];
    const violations: string[] = [];

    for (const file of collectTsFiles(PUBLIC_DIR)) {
      const relativeFile = file.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, '');
      const source = readFileSync(file, 'utf-8');
      for (const specifier of extractImports(source)) {
        if (forbiddenFragments.some((fragment) => specifier.includes(fragment))) {
          violations.push(`${relativeFile} → ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
