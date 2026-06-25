/**
 * Value objects for monetary amounts.
 * Currently `number` aliases — swap underlying type without renaming fields.
 * @see docs/DOMAIN-LANGUAGE.md
 */

/** Positive integer. Base type for all amount value objects. */
export type Amount = number;

/** Stake placed in a single round. */
export type BetAmount = Amount;

/** Total returned on a successful round (includes original stake). */
export type RewardAmount = Amount;

/** Net gain if the round is won. */
export type ProfitAmount = Amount;

/** Bankroll or cumulative stake amount. */
export type BankrollAmount = Amount;
