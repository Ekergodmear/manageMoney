import { describe, expect, it } from 'vitest';

import type { CalculationRequest } from '@/application/dto';
import { netRewardFromBet, profitIfWinAtBet } from '@/core/monetary/net-reward';
import { encodeRewardMultiplier } from '@/core/monetary/reward-multiplier-encoding';
import { solve } from '@/core/solver';
import { solveMinimalFeasibleBet } from '@/core/solver/solve-minimal-feasible-bet';
import { validateCalculationRequest } from '@/core/validation';

const WIN_TAX = { threshold: 10_000_000, ratePercent: 10 } as const;

function solveRequest(request: CalculationRequest) {
  const validated = validateCalculationRequest(request);
  expect(validated.kind).toBe('success');
  if (validated.kind !== 'success') {
    return null;
  }
  return solve(validated.value);
}

describe('Tier win tax', () => {
  it('netReward — no tax below threshold', () => {
    const encoded = encodeRewardMultiplier(120);
    expect(netRewardFromBet(80_000, encoded, WIN_TAX)).toBe(9_600_000);
  });

  it('netReward — 10% on gross at or above 10M', () => {
    const encoded = encodeRewardMultiplier(120);
    expect(netRewardFromBet(100_000, encoded, WIN_TAX)).toBe(10_800_000);
  });

  it('user scenario — 100k bet at 11.86M spent is loss without tax awareness in profit check', () => {
    const encoded = encodeRewardMultiplier(120);
    const accumulatedBefore = 11_760_000;
    const bet = 100_000;

    expect(profitIfWinAtBet(bet, accumulatedBefore, encoded, undefined)).toBe(140_000);
    expect(profitIfWinAtBet(bet, accumulatedBefore, encoded, WIN_TAX)).toBe(-1_060_000);
  });

  it('solver raises bet when accumulated spend crosses taxed region — user scenario', () => {
    const encoded = encodeRewardMultiplier(120);
    const bet = solveMinimalFeasibleBet(
      11_760_000,
      0,
      encoded,
      10_000,
      10_000,
      WIN_TAX,
    );

    expect(bet).toBeGreaterThan(100_000);
    expect(bet).toBe(110_000);
    expect(profitIfWinAtBet(bet, 11_760_000, encoded, WIN_TAX)).toBeGreaterThanOrEqual(0);
    expect(netRewardFromBet(bet, encoded, WIN_TAX)).toBe(11_880_000);
  });

  it('requests without winTax — unchanged from linear reward', () => {
    const request: CalculationRequest = {
      rewardMultiplier: 20,
      roundCount: 1,
      minimumBet: 10_000,
      betStep: 10_000,
      targetProfit: { mode: 'fixedAmount', amount: 100_000 },
    };

    const result = solveRequest(request);
    expect(result?.kind).toBe('success');
    if (result?.kind !== 'success') {
      return;
    }

    expect(result.value.rounds[0]?.rewardAmount).toBe(200_000);
  });

  it('full plan with tax — late rounds use higher bets than without tax', () => {
    const base: CalculationRequest = {
      rewardMultiplier: 120,
      roundCount: 50,
      minimumBet: 10_000,
      betStep: 10_000,
      targetProfit: { mode: 'fixedAmount', amount: 100_000 },
    };

    const withoutTax = solveRequest(base);
    const withTax = solveRequest({ ...base, winTax: WIN_TAX });
    expect(withoutTax?.kind).toBe('success');
    expect(withTax?.kind).toBe('success');
    if (withoutTax?.kind !== 'success' || withTax?.kind !== 'success') {
      return;
    }

    const lastWithout = withoutTax.value.rounds.at(-1);
    const lastWith = withTax.value.rounds.at(-1);
    expect(lastWithout).toBeDefined();
    expect(lastWith).toBeDefined();
    expect(lastWith!.betAmount).toBeGreaterThanOrEqual(lastWithout!.betAmount);
  });
});
