/**
 * Sprint 3.2C.2 — Candidate builder unit tests (pure constructors).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { CalculationRequest } from '@/application/dto';
import { createProfitCandidate, createRoundCandidate } from '@/core/optimization/candidates';

const ROOT = join(import.meta.dirname, '../../..');
const CANDIDATES_DIR = join(ROOT, 'src/core/optimization/candidates');

const FORBIDDEN_IMPORTS = [
  '@/public',
  '@/core/solver',
  '@/core/validation',
  'search-policy',
  'optimize',
  'validateCalculationRequest',
  'solve(',
  'defaultSearchPolicy',
];

const intent: CalculationRequest = {
  rewardMultiplier: 20,
  roundCount: 50,
  minimumBet: 10_000,
  betStep: 1_000,
  targetProfit: { mode: 'fixedAmount', amount: 100_000 },
};

describe('createProfitCandidate', () => {
  it('sets fixedAmount targetProfit on a copy', () => {
    const candidate = createProfitCandidate(intent, 95_000);

    expect(candidate).toEqual({
      ...intent,
      targetProfit: { mode: 'fixedAmount', amount: 95_000 },
    });
  });

  it('does not mutate intent', () => {
    const frozen = structuredClone(intent);
    createProfitCandidate(intent, 95_000);
    expect(intent).toEqual(frozen);
  });
});

describe('createRoundCandidate', () => {
  it('sets roundCount on a copy', () => {
    const candidate = createRoundCandidate(intent, 49);

    expect(candidate).toEqual({
      ...intent,
      roundCount: 49,
    });
  });

  it('does not mutate intent', () => {
    const frozen = structuredClone(intent);
    createRoundCandidate(intent, 49);
    expect(intent).toEqual(frozen);
  });
});

describe('createProfitCandidate + createRoundCandidate compose', () => {
  it('shapes nested candidate without mutating intent', () => {
    const frozen = structuredClone(intent);
    const candidate = createProfitCandidate(createRoundCandidate(intent, 49), 90_000);

    expect(candidate.roundCount).toBe(49);
    expect(candidate.targetProfit).toEqual({ mode: 'fixedAmount', amount: 90_000 });
    expect(intent).toEqual(frozen);
  });
});

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

describe('Architecture — candidate builders isolation', () => {
  const files = collectTsFiles(CANDIDATES_DIR);

  it.each(files)('%s must not import policy, engine, or public API', (file) => {
    const content = readFileSync(file, 'utf-8');
    for (const forbidden of FORBIDDEN_IMPORTS) {
      expect(content.includes(forbidden)).toBe(false);
    }
  });
});
