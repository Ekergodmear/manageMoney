import { describe, expect, it } from 'vitest';

import type { CalculationRequest, TargetProfit } from '@/application/dto';
import { encodeRewardMultiplier, rewardFromBet } from '@/core/monetary/reward-multiplier-encoding';
import { resolveTarget } from '@/core/solver/resolve-target';
import { solveMinimalFeasibleBet } from '@/core/solver/solve-minimal-feasible-bet';
import { solve } from '@/core/solver';
import { validateCalculationRequest } from '@/core/validation';

import fixedGolden from '../../fixtures/solver/fixed-profit-x20-5-rounds.golden.json';

function solveStrategy(request: CalculationRequest) {
  const validated = validateCalculationRequest(request);
  if (validated.kind !== 'success') {
    throw new Error('expected valid request');
  }
  const result = solve(validated.value);
  if (result.kind !== 'success') {
    throw new Error('expected solve success');
  }
  return result.value;
}

function pStar(targetProfit: TargetProfit, accumulatedSpentBefore: number): number {
  return resolveTarget(targetProfit, accumulatedSpentBefore);
}

describe('ConstraintSolver — invariants I1–I8', () => {
  const request = fixedGolden.request as CalculationRequest;
  const strategy = solveStrategy(request);
  const encoded = encodeRewardMultiplier(request.rewardMultiplier);
  const bMin = request.minimumBet;
  const s = request.betStep;

  it.each(strategy.rounds.map((round, idx) => ({ round, idx })))(
    'round $round.index satisfies I1–I8',
    ({ round, idx }) => {
      const previousRound = idx > 0 ? strategy.rounds[idx - 1] : undefined;
      const accumulatedSpentBefore =
        previousRound === undefined ? 0 : previousRound.accumulatedSpent;
      const target = pStar(request.targetProfit, accumulatedSpentBefore);
      const profit = round.rewardAmount - round.accumulatedSpent;

      expect(profit).toBeGreaterThanOrEqual(target);
      expect(round.betAmount).toBeGreaterThanOrEqual(bMin);
      expect(round.betAmount % s).toBe(0);
      expect(round.rewardAmount).toBe(rewardFromBet(round.betAmount, encoded));
      expect(Number.isInteger(round.betAmount)).toBe(true);
      expect(round.accumulatedSpent).toBe(accumulatedSpentBefore + round.betAmount);

      if (previousRound !== undefined) {
        expect(round.accumulatedSpent).toBeGreaterThan(previousRound.accumulatedSpent);
      }

      let sumBets = 0;
      for (let k = 0; k <= idx; k++) {
        const r = strategy.rounds[k];
        if (r !== undefined) {
          sumBets += r.betAmount;
        }
      }
      expect(round.accumulatedSpent).toBe(sumBets);
    },
  );
});

describe('ConstraintSolver — constructive proof checkpoints', () => {
  const base = {
    rewardMultiplier: 20,
    minimumBet: 10_000,
    betStep: 1_000,
    targetProfit: { mode: 'fixedAmount' as const, amount: 100_000 },
  };

  it('round 1 (§1 constructive proof)', () => {
    const bet = solveMinimalFeasibleBet(0, 100_000, encodeRewardMultiplier(20), 10_000, 1_000);
    expect(bet).toBe(10_000);
  });

  it('round 12 (§2 constructive proof)', () => {
    const bet = solveMinimalFeasibleBet(
      111_000,
      100_000,
      encodeRewardMultiplier(20),
      10_000,
      1_000,
    );
    expect(bet).toBe(12_000);
  });

  it('round 50 (§3 constructive proof)', () => {
    const strategy = solveStrategy({ ...base, roundCount: 50 });
    const last = strategy.rounds.at(-1);
    expect(last).toBeDefined();
    if (last === undefined) {
      return;
    }
    expect(last.betAmount).toBe(81_000);
    expect(last.rewardAmount - last.accumulatedSpent).toBe(100_000);
    expect(last.accumulatedSpent).toBe(1_520_000);
  });
});
