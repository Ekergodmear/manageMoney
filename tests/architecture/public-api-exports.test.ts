/**
 * Package exports — single entry point; deep imports must not resolve.
 * @see docs/design/public-api-spec.md §4
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '../..');

describe('Architecture — package.json exports', () => {
  it('declares only the root entry (no deep import subpaths)', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')) as {
      exports?: Record<string, unknown>;
    };
    expect(pkg.exports).toBeDefined();
    expect(Object.keys(pkg.exports ?? {}).sort()).toEqual(['.']);
  });

  it('root export points at built dist contract', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')) as {
      exports: { '.': { import: string; types: string } };
    };
    expect(pkg.exports['.']).toEqual({
      types: './dist/index.d.ts',
      import: './dist/index.js',
    });
  });

  it('tsconfig maps @stake/constraint-engine to public entry (dev)', () => {
    const tsconfig = JSON.parse(readFileSync(join(ROOT, 'tsconfig.json'), 'utf-8')) as {
      compilerOptions: { paths: Record<string, string[]> };
    };
    expect(tsconfig.compilerOptions.paths['@stake/constraint-engine']).toEqual([
      'src/public/index.ts',
    ]);
  });

  it('does not expose core subpath in package exports', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')) as {
      exports?: Record<string, unknown>;
    };
    const subpaths = Object.keys(pkg.exports ?? {}).filter((key) => key.includes('core'));
    expect(subpaths).toEqual([]);
  });
});
