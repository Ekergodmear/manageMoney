/**
 * Architecture smoke tests — Sprint 1+
 * @see tests/architecture/README.md
 */
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../..');

describe('Architecture — layer folders (rev. 2)', () => {
  const requiredDirs = [
    'src/application/strategy',
    'src/application/validation',
    'src/application/dto',
    'src/core/models',
    'src/core/contracts',
    'src/core/algorithms',
    'src/core/validation',
    'src/core/solver',
    'src/core/strategy-builder',
    'src/core/statistics-builder',
    'src/core/simulation',
    'src/public',
    'src/core/optimization',
    'src/core/report',
    'src/core/utils',
    'src/features/planner',
    'src/components',
    'src/hooks',
    'src/pages',
    'tests/architecture',
    'tests/fixtures',
    'benchmarks',
  ];

  it.each(requiredDirs)('exists: %s', (dir) => {
    expect(existsSync(join(ROOT, dir))).toBe(true);
  });
});

describe('Architecture — fixtures', () => {
  const fixtures = [
    'tests/fixtures/fixed-profit-x20-5-rounds.json',
    'tests/fixtures/break-even-x20-5-rounds.json',
    'tests/fixtures/x20-10-rounds.json',
    'tests/fixtures/x40-100-rounds.json',
    'tests/fixtures/min-bet-equals-step.json',
  ];

  it.each(fixtures)('exists: %s', (file) => {
    expect(existsSync(join(ROOT, file))).toBe(true);
  });
});

describe('Architecture — frozen docs', () => {
  const docs = [
    'docs/TECH-STACK.md',
    'docs/CODING-STANDARD.md',
    'docs/CONTRACTS.md',
    'docs/DOMAIN-LANGUAGE.md',
    'docs/FLOWS.md',
    'docs/MATHEMATICAL-SPECIFICATION.md',
    'docs/FOLDER-STRUCTURE.md',
  ];

  it.each(docs)('exists: %s', (doc) => {
    expect(existsSync(join(ROOT, doc))).toBe(true);
  });
});

describe('Architecture — removed paths must not exist', () => {
  it('no src/core/strategy (renamed to strategy-builder)', () => {
    expect(existsSync(join(ROOT, 'src/core/strategy'))).toBe(false);
  });

  it('no src/app', () => {
    expect(existsSync(join(ROOT, 'src/app'))).toBe(false);
  });

  it('no src/index.ts project-wide barrel', () => {
    expect(existsSync(join(ROOT, 'src/index.ts'))).toBe(false);
  });
});
