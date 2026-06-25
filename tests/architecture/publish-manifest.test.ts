/**
 * Package publish surface — files, exports, sideEffects.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '../..');

interface PackageJson {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly license: string;
  readonly type: string;
  readonly sideEffects: boolean;
  readonly engines: { readonly node: string };
  readonly files: readonly string[];
  readonly exports: {
    readonly '.': {
      readonly types: string;
      readonly import: string;
    };
  };
  readonly types: string;
  readonly module: string;
  readonly keywords: readonly string[];
  readonly repository: { readonly type: string; readonly url: string };
  readonly bugs: { readonly url: string };
  readonly homepage: string;
}

describe('Architecture — publish manifest', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')) as PackageJson;

  it('uses scoped SDK package name', () => {
    expect(pkg.name).toBe('@stake/constraint-engine');
  });

  it('publishes only dist, README, LICENSE', () => {
    expect([...pkg.files].sort()).toEqual(['LICENSE', 'README.md', 'dist']);
  });

  it('declares sideEffects false', () => {
    expect(pkg.sideEffects).toBe(false);
  });

  it('exports built dist entry only', () => {
    expect(pkg.exports['.']).toEqual({
      types: './dist/index.d.ts',
      import: './dist/index.js',
    });
    expect(pkg.types).toBe('./dist/index.d.ts');
    expect(pkg.module).toBe('./dist/index.js');
  });

  it('requires Node 22+', () => {
    expect(pkg.engines.node).toBe('>=22');
  });

  it('has publish metadata fields', () => {
    expect(pkg.description.length).toBeGreaterThan(10);
    expect(pkg.license).toBe('MIT');
    expect(pkg.keywords.length).toBeGreaterThanOrEqual(3);
    expect(pkg.repository.url).toBe('git+https://github.com/Ekergodmear/manageMoney.git');
    expect(pkg.bugs.url).toBe('https://github.com/Ekergodmear/manageMoney/issues');
    expect(pkg.homepage).toBe('https://github.com/Ekergodmear/manageMoney#readme');
    expect(pkg.repository.url).not.toContain('example.com');
  });
});
