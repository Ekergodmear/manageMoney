/**
 * SOLVE_MINIMAL_FEASIBLE_BET — frozen pseudo-code + tier win tax extension.
 * @see docs/design/solver-pseudocode.md
 * @see docs/design/tier-win-tax-brief.md
 */

import type { WinTax } from '@/application/dto';
import {
  grossRewardFromBet,
  profitIfWinAtBet,
} from '@/core/monetary/net-reward';
import type { EncodedRewardMultiplier } from '@/core/monetary/reward-multiplier-encoding';
import { scaledProfitMargin } from '@/core/monetary/reward-multiplier-encoding';

import { ceilToStep } from './integer-math';

function linearMinimalBet(
  accumulatedSpentBefore: number,
  pStar: number,
  encodedRewardMultiplier: EncodedRewardMultiplier,
  minimumBet: number,
  betStep: number,
): number {
  const numerator = (accumulatedSpentBefore + pStar) * encodedRewardMultiplier.scale;
  const candidate = ceilToStep(
    numerator,
    scaledProfitMargin(encodedRewardMultiplier),
    betStep,
  );
  return Math.max(minimumBet, candidate);
}

/** Smallest bet on lattice with grossReward(bet) ≥ threshold. */
function smallestBetAtTaxThreshold(
  threshold: number,
  encoded: EncodedRewardMultiplier,
  minimumBet: number,
  betStep: number,
): number {
  const numerator = threshold * encoded.scale;
  const candidate = ceilToStep(numerator, encoded.scaled, betStep);
  return Math.max(minimumBet, candidate);
}

function taxedProfitMargin(encoded: EncodedRewardMultiplier, ratePercent: number): number {
  return encoded.scaled * (100 - ratePercent) - encoded.scale * 100;
}

function solveWithTierTax(
  accumulatedSpentBefore: number,
  pStar: number,
  encodedRewardMultiplier: EncodedRewardMultiplier,
  minimumBet: number,
  betStep: number,
  winTax: WinTax,
): number {
  const candidates: number[] = [];

  const untaxedCandidate = linearMinimalBet(
    accumulatedSpentBefore,
    pStar,
    encodedRewardMultiplier,
    minimumBet,
    betStep,
  );
  const untaxedGross = grossRewardFromBet(untaxedCandidate, encodedRewardMultiplier);
  if (
    untaxedGross < winTax.threshold &&
    profitIfWinAtBet(
      untaxedCandidate,
      accumulatedSpentBefore,
      encodedRewardMultiplier,
      winTax,
    ) >= pStar
  ) {
    candidates.push(untaxedCandidate);
  }

  const taxedMargin = taxedProfitMargin(encodedRewardMultiplier, winTax.ratePercent);
  const taxEntryBet = smallestBetAtTaxThreshold(
    winTax.threshold,
    encodedRewardMultiplier,
    minimumBet,
    betStep,
  );

  if (taxedMargin > 0) {
    const numerator = (accumulatedSpentBefore + pStar) * encodedRewardMultiplier.scale * 100;
    const taxedCandidate = Math.max(
      taxEntryBet,
      ceilToStep(numerator, taxedMargin, betStep),
    );
    if (
      profitIfWinAtBet(
        taxedCandidate,
        accumulatedSpentBefore,
        encodedRewardMultiplier,
        winTax,
      ) >= pStar
    ) {
      candidates.push(taxedCandidate);
    }
  }

  if (
    profitIfWinAtBet(taxEntryBet, accumulatedSpentBefore, encodedRewardMultiplier, winTax) >=
    pStar
  ) {
    candidates.push(taxEntryBet);
  }

  if (candidates.length > 0) {
    return Math.min(...candidates);
  }

  let bet = minimumBet;
  const searchCap = Math.max(
    taxEntryBet,
    untaxedCandidate,
    accumulatedSpentBefore + pStar + winTax.threshold,
  );
  while (bet <= searchCap) {
    if (
      profitIfWinAtBet(bet, accumulatedSpentBefore, encodedRewardMultiplier, winTax) >= pStar
    ) {
      return bet;
    }
    bet += betStep;
  }

  return Math.max(minimumBet, untaxedCandidate);
}

export function solveMinimalFeasibleBet(
  accumulatedSpentBefore: number,
  pStar: number,
  encodedRewardMultiplier: EncodedRewardMultiplier,
  minimumBet: number,
  betStep: number,
  winTax?: WinTax,
): number {
  if (winTax === undefined) {
    return linearMinimalBet(
      accumulatedSpentBefore,
      pStar,
      encodedRewardMultiplier,
      minimumBet,
      betStep,
    );
  }

  return solveWithTierTax(
    accumulatedSpentBefore,
    pStar,
    encodedRewardMultiplier,
    minimumBet,
    betStep,
    winTax,
  );
}
