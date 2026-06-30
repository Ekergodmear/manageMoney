/**
 * Sprint 3.2A — SearchPolicy unit tests (no search engine, no Core SDK).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { CalculationRequest } from '@/application/dto';
import { defaultSearchPolicy } from '@/core/optimization/search-policy';

const ROOT = join(import.meta.dirname, '../../..');
const POLICY_DIR = join(ROOT, 'src/core/optimization/search-policy');

const FORBIDDEN_IMPORTS = [
  '@/public',
  '@/core/solver',
  '@/core/validation',
  '@/core/strategy-builder',
  '@/core/statistics-builder',
  '@/core/simulation',
  'validateCalculationRequest',
  'buildStrategy',
  'buildStatistics',
  'solve(',
];

const intent: CalculationRequest = {
  rewardMultiplier: 20,
  roundCount: 50,
  minimumBet: 10_000,
  betStep: 1_000,
  targetProfit: { mode: 'fixedAmount', amount: 100_000 },
};

const policy = defaultSearchPolicy;
const granularity = 5_000;

describe('SearchPolicy — profit progression', () => {
  it('steps down by profitGranularity', () => {
    expect(policy.nextProfit(intent, 100_000, granularity)).toBe(95_000);
    expect(policy.nextProfit(intent, 95_000, granularity)).toBe(90_000);
    expect(policy.nextProfit(intent, 90_000, granularity)).toBe(85_000);
  });

  it('does not skip intermediate steps (minimal-step)', () => {
    const steps: number[] = [];
    let current = 100_000;

    for (let i = 0; i < 5; i++) {
      const next = policy.nextProfit(intent, current, granularity);
      if (next === null) {
        break;
      }
      steps.push(next);
      current = next;
    }

    expect(steps).toEqual([95_000, 90_000, 85_000, 80_000, 75_000]);
  });
});

describe('SearchPolicy — round progression', () => {
  it('decrements by one', () => {
    expect(policy.nextRoundCount(intent, 50)).toBe(49);
    expect(policy.nextRoundCount(intent, 49)).toBe(48);
    expect(policy.nextRoundCount(intent, 48)).toBe(47);
  });
});

describe('SearchPolicy — boundaries', () => {
  it('returns null when profit is already 0', () => {
    expect(policy.nextProfit(intent, 0, granularity)).toBeNull();
  });

  it('lands on 0 then null on next step', () => {
    expect(policy.nextProfit(intent, 5_000, granularity)).toBe(0);
    expect(policy.nextProfit(intent, 0, granularity)).toBeNull();
  });

  it('steps to 0 when remainder is smaller than granularity', () => {
    expect(policy.nextProfit(intent, 3_000, granularity)).toBe(0);
  });

  it('returns null when round count is 1', () => {
    expect(policy.nextRoundCount(intent, 1)).toBeNull();
  });

  it('returns null when round count exceeds intent (invalid candidate)', () => {
    expect(policy.nextRoundCount(intent, 51)).toBeNull();
  });
});

describe('SearchPolicy — deterministic', () => {
  it('returns the same next profit for the same inputs', () => {
    const a = policy.nextProfit(intent, 100_000, granularity);
    const b = policy.nextProfit(intent, 100_000, granularity);
    expect(a).toBe(b);
  });

  it('returns the same next round for the same inputs', () => {
    const a = policy.nextRoundCount(intent, 50);
    const b = policy.nextRoundCount(intent, 50);
    expect(a).toBe(b);
  });
});

describe('SearchPolicy — finite termination', () => {
  it('profit sequence from 100k to 0 always terminates', () => {
    let current = 100_000;
    let steps = 0;
    const maxSteps = 100_000 / granularity + 2;

    while (current > 0) {
      const next = policy.nextProfit(intent, current, granularity);
      expect(next).not.toBeNull();
      if (next === null) {
        break;
      }
      current = next;
      steps++;
      expect(steps).toBeLessThanOrEqual(maxSteps);
    }

    expect(current).toBe(0);
    expect(policy.nextProfit(intent, 0, granularity)).toBeNull();
  });

  it('round sequence from 50 to 1 always terminates', () => {
    let current = 50;
    let steps = 0;

    while (current > 1) {
      const next = policy.nextRoundCount(intent, current);
      expect(next).not.toBeNull();
      if (next === null) {
        break;
      }
      current = next;
      steps++;
    }

    expect(steps).toBe(49);
    expect(current).toBe(1);
    expect(policy.nextRoundCount(intent, 1)).toBeNull();
  });
});

describe('SearchPolicy — mode guard', () => {
  it('returns null for breakEven intent profit steps', () => {
    const breakEvenIntent: CalculationRequest = {
      ...intent,
      targetProfit: { mode: 'breakEven' },
    };
    expect(policy.nextProfit(breakEvenIntent, 100_000, granularity)).toBeNull();
  });

  it('returns null for percentage intent profit steps (deterministic unsupported)', () => {
    const percentageIntent: CalculationRequest = {
      ...intent,
      targetProfit: { mode: 'percentage', percentage: 10 },
    };
    expect(policy.nextProfit(percentageIntent, 100_000, granularity)).toBeNull();
  });
});

describe('SearchPolicy — terminal idempotence', () => {
  it('returns null on repeated calls after terminal profit state', () => {
    expect(policy.nextProfit(intent, 0, granularity)).toBeNull();
    expect(policy.nextProfit(intent, 0, granularity)).toBeNull();
    expect(policy.nextProfit(intent, 0, granularity)).toBeNull();
  });

  it('returns null on repeated calls after terminal round state', () => {
    expect(policy.nextRoundCount(intent, 1)).toBeNull();
    expect(policy.nextRoundCount(intent, 1)).toBeNull();
  });

  it('stays null after landing on 0 profit', () => {
    expect(policy.nextProfit(intent, 5_000, granularity)).toBe(0);
    expect(policy.nextProfit(intent, 0, granularity)).toBeNull();
    expect(policy.nextProfit(intent, 0, granularity)).toBeNull();
  });
});

describe('SearchPolicy — intent immutability', () => {
  it('does not mutate intent on nextProfit', () => {
    const frozen = structuredClone(intent);
    policy.nextProfit(intent, 100_000, granularity);
    expect(intent).toEqual(frozen);
  });

  it('does not mutate intent on nextRoundCount', () => {
    const frozen = structuredClone(intent);
    policy.nextRoundCount(intent, 50);
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

describe('Architecture — SearchPolicy isolation', () => {
  const files = collectTsFiles(POLICY_DIR);

  it.each(files)('%s must not import Core SDK or public API', (file) => {
    const content = readFileSync(file, 'utf-8');
    for (const forbidden of FORBIDDEN_IMPORTS) {
      expect(content.includes(forbidden)).toBe(false);
    }
  });
});
