/**
 * StatisticsBuilder unit tests (Sprint 2.5).
 * @see docs/design/statistics-builder-spec.md
 */

import { describe, expect, it } from 'vitest';

import type { Round, Strategy } from '@/core/models';
import { buildStatistics } from '@/core/statistics-builder';

import breakEvenGolden from '../../fixtures/statistics-builder/break-even-x20-5-rounds.golden.json';
import fixedProfitGolden from '../../fixtures/statistics-builder/fixed-profit-x20-5-rounds.golden.json';
import percentageGolden from '../../fixtures/statistics-builder/percentage-x20-3-rounds.golden.json';

interface StatisticsGoldenFixture {
  readonly name: string;
  readonly strategy: Strategy;
  readonly statistics: ReturnType<typeof buildStatistics>;
}

const GOLDEN_FIXTURES = [
  fixedProfitGolden,
  breakEvenGolden,
  percentageGolden,
] as const satisfies readonly StatisticsGoldenFixture[];

function makeRound(index: number, betAmount: number): Round {
  return {
    index,
    betAmount,
    rewardAmount: betAmount * 20,
    accumulatedSpent: betAmount * index,
  };
}

function makeStrategy(rounds: readonly Round[]): Strategy {
  return { rounds };
}

describe('StatisticsBuilder — buildStatistics', () => {
  it('T1 — empty strategy: all statistics are zero', () => {
    expect(buildStatistics({ rounds: [] })).toEqual({
      roundCount: 0,
      requiredBankrollAmount: 0,
      maximumBetAmount: 0,
      averageBetAmount: 0,
      minimumBetAmount: 0,
      expectedProfitAmount: 0,
    });
  });

  it('T2 — one round', () => {
    const strategy = makeStrategy([makeRound(1, 10_000)]);
    expect(buildStatistics(strategy)).toEqual({
      roundCount: 1,
      requiredBankrollAmount: 10_000,
      maximumBetAmount: 10_000,
      averageBetAmount: 10_000,
      minimumBetAmount: 10_000,
      expectedProfitAmount: 200_000 - 10_000,
    });
  });

  it('T3 — fifty rounds', () => {
    const rounds = Array.from({ length: 50 }, (_, i) => makeRound(i + 1, 1_000));
    const stats = buildStatistics(makeStrategy(rounds));
    expect(stats.roundCount).toBe(50);
    expect(stats.averageBetAmount).toBe(1_000);
    expect(stats.requiredBankrollAmount).toBe(50_000);
  });

  it('T4 — requiredBankrollAmount = last.accumulatedSpent', () => {
    const strategy = makeStrategy([
      { index: 1, betAmount: 5_000, rewardAmount: 100_000, accumulatedSpent: 5_000 },
      { index: 2, betAmount: 15_000, rewardAmount: 300_000, accumulatedSpent: 20_000 },
    ]);
    expect(buildStatistics(strategy).requiredBankrollAmount).toBe(20_000);
  });

  it('T5 — maximumBetAmount', () => {
    const strategy = makeStrategy([
      makeRound(1, 5_000),
      makeRound(2, 25_000),
      makeRound(3, 10_000),
    ]);
    expect(buildStatistics(strategy).maximumBetAmount).toBe(25_000);
  });

  it('T6 — minimumBetAmount', () => {
    const strategy = makeStrategy([
      makeRound(1, 5_000),
      makeRound(2, 25_000),
      makeRound(3, 10_000),
    ]);
    expect(buildStatistics(strategy).minimumBetAmount).toBe(5_000);
  });

  it('T7 — averageBetAmount uses floor division', () => {
    const strategy = makeStrategy([
      makeRound(1, 10_000),
      makeRound(2, 10_000),
      makeRound(3, 10_000),
    ]);
    expect(buildStatistics(strategy).averageBetAmount).toBe(10_000);

    const uneven = makeStrategy([makeRound(1, 10_000), makeRound(2, 10_000), makeRound(3, 10_001)]);
    expect(buildStatistics(uneven).averageBetAmount).toBe(10_000);
  });

  it('T8 — expectedProfitAmount is terminal profit (last round win)', () => {
    const strategy = makeStrategy([
      { index: 1, betAmount: 10_000, rewardAmount: 200_000, accumulatedSpent: 10_000 },
      { index: 2, betAmount: 20_000, rewardAmount: 400_000, accumulatedSpent: 30_000 },
    ]);
    expect(buildStatistics(strategy).expectedProfitAmount).toBe(400_000 - 30_000);
  });
});

describe('StatisticsBuilder — golden master', () => {
  it.each(GOLDEN_FIXTURES)('T9 — $name: Strategy → Statistics matches golden', (fixture) => {
    const actual = buildStatistics(fixture.strategy);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(fixture.statistics));
  });
});

describe('StatisticsBuilder — immutability and snapshot', () => {
  it('T10 — Strategy unchanged after buildStatistics', () => {
    const rounds = [makeRound(1, 10_000), makeRound(2, 10_000)];
    const snapshot = structuredClone(rounds);
    const strategy = makeStrategy(rounds);
    buildStatistics(strategy);
    expect(rounds).toEqual(snapshot);
  });

  it('T11 — statistics snapshot independent of later Strategy mutation', () => {
    const rounds: Round[] = [
      { index: 1, betAmount: 10_000, rewardAmount: 200_000, accumulatedSpent: 10_000 },
      { index: 2, betAmount: 20_000, rewardAmount: 400_000, accumulatedSpent: 30_000 },
    ];
    const strategy = makeStrategy(rounds);
    const statistics = buildStatistics(strategy);
    rounds.push(makeRound(3, 99_000));
    expect(statistics.roundCount).toBe(2);
    expect(statistics.requiredBankrollAmount).toBe(30_000);
  });
});

describe('StatisticsBuilder — T12 permutation (commutative vs terminal stats)', () => {
  it('min, max, average invariant under round reorder; requiredBankroll and expectedProfit may change', () => {
    const rounds: Round[] = [
      { index: 1, betAmount: 5_000, rewardAmount: 100_000, accumulatedSpent: 5_000 },
      { index: 2, betAmount: 15_000, rewardAmount: 300_000, accumulatedSpent: 20_000 },
      { index: 3, betAmount: 10_000, rewardAmount: 200_000, accumulatedSpent: 30_000 },
    ];
    const original = buildStatistics(makeStrategy(rounds));

    const round0 = rounds[0];
    const round1 = rounds[1];
    const round2 = rounds[2];
    if (round0 === undefined || round1 === undefined || round2 === undefined) {
      throw new Error('fixture rounds missing');
    }

    const permuted: Round[] = [round2, round0, round1];
    const permutedStats = buildStatistics(makeStrategy(permuted));

    expect(permutedStats.minimumBetAmount).toBe(original.minimumBetAmount);
    expect(permutedStats.maximumBetAmount).toBe(original.maximumBetAmount);
    expect(permutedStats.averageBetAmount).toBe(original.averageBetAmount);

    expect(permutedStats.requiredBankrollAmount).not.toBe(original.requiredBankrollAmount);
    expect(permutedStats.expectedProfitAmount).not.toBe(original.expectedProfitAmount);
  });
});
