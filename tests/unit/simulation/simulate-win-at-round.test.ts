/**
 * SimulationEngine unit tests (Sprint 2.6).
 * @see docs/design/simulation-engine-spec.md
 */

import { describe, expect, it } from 'vitest';

import type { Round, Strategy } from '@/core/models';
import { simulateWinAtRound } from '@/core/simulation';

import winAt1Golden from '../../fixtures/simulation/fixed-profit-win-at-1.golden.json';
import winAt5Golden from '../../fixtures/simulation/fixed-profit-win-at-5.golden.json';

const GOLDEN_FIXTURES = [winAt5Golden, winAt1Golden] as const;

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

function countWins(result: { rounds: readonly { result: string }[] }): number {
  let wins = 0;
  for (const round of result.rounds) {
    if (round.result === 'Win') {
      wins++;
    }
  }
  return wins;
}

describe('SimulationEngine — simulateWinAtRound', () => {
  it('T1 — invalid winAtRound returns failure', () => {
    const strategy = makeStrategy([makeRound(1, 10_000)]);
    expect(simulateWinAtRound(strategy, 0).kind).toBe('failure');
    expect(simulateWinAtRound(strategy, 2).kind).toBe('failure');
    expect(simulateWinAtRound(strategy, 1.5).kind).toBe('failure');
  });

  it('T2 — win at round 1: Win then NotPlayed', () => {
    const result = simulateWinAtRound(
      makeStrategy([makeRound(1, 10_000), makeRound(2, 10_000)]),
      1,
    );
    expect(result.kind).toBe('success');
    if (result.kind !== 'success') {
      return;
    }
    expect(result.value.rounds[0]?.result).toBe('Win');
    expect(result.value.rounds[1]?.result).toBe('NotPlayed');
    expect(countWins(result.value)).toBe(1);
  });

  it('T3 — win at final round: Lose* then Win', () => {
    const strategy = makeStrategy([makeRound(1, 5_000), makeRound(2, 5_000), makeRound(3, 5_000)]);
    const result = simulateWinAtRound(strategy, 3);
    expect(result.kind).toBe('success');
    if (result.kind !== 'success') {
      return;
    }
    expect(result.value.rounds.map((r) => r.result)).toEqual(['Lose', 'Lose', 'Win']);
    expect(countWins(result.value)).toBe(1);
  });

  it('T4 — win at middle round', () => {
    const strategy = makeStrategy([
      makeRound(1, 5_000),
      makeRound(2, 10_000),
      makeRound(3, 15_000),
    ]);
    const result = simulateWinAtRound(strategy, 2);
    expect(result.kind).toBe('success');
    if (result.kind !== 'success') {
      return;
    }
    expect(result.value.rounds.map((r) => r.result)).toEqual(['Lose', 'Win', 'NotPlayed']);
  });

  it('T5 — profitAmount is terminal scenario profit', () => {
    const strategy = makeStrategy([
      { index: 1, betAmount: 10_000, rewardAmount: 200_000, accumulatedSpent: 10_000 },
      { index: 2, betAmount: 20_000, rewardAmount: 400_000, accumulatedSpent: 30_000 },
    ]);
    const result = simulateWinAtRound(strategy, 2);
    expect(result.kind).toBe('success');
    if (result.kind === 'success') {
      expect(result.value.profitAmount).toBe(400_000 - 30_000);
    }
  });

  it('T6 — requiredBankrollAmount from winning round accumulatedSpent', () => {
    const strategy = makeStrategy([
      { index: 1, betAmount: 10_000, rewardAmount: 200_000, accumulatedSpent: 10_000 },
      { index: 2, betAmount: 20_000, rewardAmount: 400_000, accumulatedSpent: 30_000 },
    ]);
    const result = simulateWinAtRound(strategy, 2);
    expect(result.kind).toBe('success');
    if (result.kind === 'success') {
      expect(result.value.requiredBankrollAmount).toBe(30_000);
    }
  });

  it('T7 — RoundSimulation projects index, result, betAmount, accumulatedSpent only', () => {
    const result = simulateWinAtRound(makeStrategy([makeRound(1, 10_000)]), 1);
    expect(result.kind).toBe('success');
    if (result.kind !== 'success') {
      return;
    }
    const projection = result.value.rounds[0];
    expect(projection).toEqual({
      index: 1,
      result: 'Win',
      betAmount: 10_000,
      accumulatedSpent: 10_000,
    });
    expect(projection).not.toHaveProperty('rewardAmount');
  });

  it('T11 — empty strategy returns EMPTY_STRATEGY', () => {
    expect(simulateWinAtRound({ rounds: [] }, 1)).toMatchObject({
      kind: 'failure',
      error: 'EMPTY_STRATEGY',
    });
  });

  it('invariant — exactly one Win per successful scenario', () => {
    const strategy = makeStrategy([
      makeRound(1, 1_000),
      makeRound(2, 2_000),
      makeRound(3, 3_000),
      makeRound(4, 4_000),
    ]);
    for (let w = 1; w <= 4; w++) {
      const result = simulateWinAtRound(strategy, w);
      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(countWins(result.value)).toBe(1);
        expect(result.value.winningRoundIndex).toBe(w);
      }
    }
  });
});

describe('SimulationEngine — golden master', () => {
  it.each(GOLDEN_FIXTURES)('T8 — $name: Strategy scenario matches golden', (fixture) => {
    const strategy = fixture.strategy as Strategy;
    const result = simulateWinAtRound(strategy, fixture.winAtRound);
    expect(result.kind).toBe('success');
    if (result.kind !== 'success') {
      return;
    }
    expect(JSON.stringify(result.value)).toBe(JSON.stringify(fixture.simulation));
  });
});

describe('SimulationEngine — immutability and snapshot', () => {
  it('T9 — Strategy unchanged after simulate', () => {
    const rounds = [makeRound(1, 10_000), makeRound(2, 10_000)];
    const snapshot = structuredClone(rounds);
    simulateWinAtRound(makeStrategy(rounds), 2);
    expect(rounds).toEqual(snapshot);
  });

  it('T10 — SimulationResult snapshot independent of later Strategy mutation', () => {
    const rounds: Round[] = [makeRound(1, 10_000), makeRound(2, 20_000)];
    const strategy = makeStrategy(rounds);
    const result = simulateWinAtRound(strategy, 2);
    expect(result.kind).toBe('success');
    rounds.push(makeRound(3, 99_000));
    if (result.kind === 'success') {
      expect(result.value.rounds).toHaveLength(2);
      expect(result.value.winningRoundIndex).toBe(2);
    }
  });
});
