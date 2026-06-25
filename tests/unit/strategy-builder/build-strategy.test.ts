/**
 * Level 1 — StrategyBuilder unit tests (Sprint 2.4).
 * @see docs/design/strategy-builder-spec.md
 */

import { describe, expect, it } from 'vitest';

import type { Round } from '@/core/models';
import { buildStrategy } from '@/core/strategy-builder';

import breakEvenGolden from '../../fixtures/strategy-builder/break-even-x20-5-rounds.golden.json';
import fixedProfitGolden from '../../fixtures/strategy-builder/fixed-profit-x20-5-rounds.golden.json';
import percentageGolden from '../../fixtures/strategy-builder/percentage-x20-3-rounds.golden.json';

interface BuilderGoldenFixture {
  readonly name: string;
  readonly rounds: readonly Round[];
  readonly strategy: { readonly rounds: readonly Round[] };
}

const GOLDEN_FIXTURES = [
  fixedProfitGolden,
  breakEvenGolden,
  percentageGolden,
] as const satisfies readonly BuilderGoldenFixture[];

function makeRound(index: number, betAmount: number): Round {
  const rewardMultiplier = 20;
  const accumulatedSpent = betAmount * index;
  return {
    index,
    betAmount,
    rewardAmount: betAmount * rewardMultiplier,
    accumulatedSpent,
  };
}

describe('StrategyBuilder — buildStrategy', () => {
  it('T1 — empty rounds returns empty Strategy (builder contract)', () => {
    const strategy = buildStrategy([]);
    expect(strategy.rounds).toEqual([]);
  });

  it('T2 — one round preserved', () => {
    const rounds = [makeRound(1, 10_000)];
    const strategy = buildStrategy(rounds);
    expect(strategy.rounds).toHaveLength(1);
    expect(strategy.rounds[0]).toEqual(rounds[0]);
  });

  it('T3 — fifty rounds preserved', () => {
    const rounds = Array.from({ length: 50 }, (_, i) => makeRound(i + 1, 1_000));
    const strategy = buildStrategy(rounds);
    expect(strategy.rounds).toHaveLength(50);
    expect(strategy.rounds[49]?.index).toBe(50);
  });

  it('T4 — round order preserved (no sort)', () => {
    const rounds = [makeRound(3, 5_000), makeRound(1, 3_000), makeRound(2, 4_000)];
    const strategy = buildStrategy(rounds);
    expect(strategy.rounds.map((r) => r.index)).toEqual([3, 1, 2]);
  });

  it('T5 — immutability: input rounds unchanged after build', () => {
    const rounds = [makeRound(1, 10_000), makeRound(2, 10_000)];
    const snapshot = structuredClone(rounds);
    buildStrategy(rounds);
    expect(rounds).toEqual(snapshot);
  });

  it('T6 — no statistics or derived fields on Strategy', () => {
    const strategy = buildStrategy([makeRound(1, 10_000)]);
    expect(Object.keys(strategy).sort()).toEqual(['rounds']);
    expect(strategy).not.toHaveProperty('statistics');
    expect(strategy).not.toHaveProperty('roundCount');
    expect(strategy).not.toHaveProperty('requiredBankrollAmount');
  });
});

describe('StrategyBuilder — golden master', () => {
  it.each(GOLDEN_FIXTURES)('T7 — $name: rounds → Strategy matches golden', (fixture) => {
    const actual = buildStrategy(fixture.rounds);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(fixture.strategy));
  });
});
