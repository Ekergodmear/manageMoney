/**
 * Request-scoped type aliases for calculation DTOs.
 * No validation — ValidationEngine (Sprint 2.2) owns rules.
 * @see docs/FLOWS.md — CalculationRequest flow
 */

import type { Amount, BetAmount } from '@/core/models';

/** Fixed payout ratio. Constraint: > 1 (enforced by ValidationEngine). */
export type RewardMultiplier = number;

/** Minimum increment between valid bet amounts. */
export type BetStep = Amount;

/** Floor bet amount for every round. */
export type MinimumBet = BetAmount;

/** Number of betting rounds in the plan. Domain scalar — not `rounds`. */
export type RoundCount = number;
