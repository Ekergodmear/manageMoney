/**
 * Sprint 3.6 — examples/ must behave like external package consumers.
 * Only @stake/constraint-engine is allowed — no monorepo aliases or src paths.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '../..');
const EXAMPLES_DIR = join(ROOT, 'examples');

const FORBIDDEN_IMPORT_PREFIXES = [
  '@/core',
  '@/public',
  '@/application',
  '../../src',
  '../../../src',
  '/src/',
] as const;

const ALLOWED_EXTERNAL = '@stake/constraint-engine';

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

function extractImportSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const regex = /from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source)) !== null) {
    const specifier = match[1];
    if (specifier) {
      specifiers.push(specifier);
    }
  }

  return specifiers;
}

describe('Architecture — examples consumer isolation', () => {
  it('examples/ exists', () => {
    expect(statSync(EXAMPLES_DIR).isDirectory()).toBe(true);
  });

  it('examples/**/*.ts import only @stake/constraint-engine (no monorepo or src paths)', () => {
    const files = collectTsFiles(EXAMPLES_DIR);
    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];

    for (const file of files) {
      const relativeFile = file.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, '');
      const source = readFileSync(file, 'utf-8');

      for (const specifier of extractImportSpecifiers(source)) {
        if (specifier.startsWith('.')) {
          continue;
        }

        if (specifier.startsWith('node:')) {
          continue;
        }

        if (specifier === ALLOWED_EXTERNAL || specifier.startsWith(`${ALLOWED_EXTERNAL}/`)) {
          continue;
        }

        if (FORBIDDEN_IMPORT_PREFIXES.some((prefix) => specifier.includes(prefix))) {
          violations.push(`${relativeFile} → forbidden path: ${specifier}`);
          continue;
        }

        violations.push(`${relativeFile} → disallowed import: ${specifier}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
