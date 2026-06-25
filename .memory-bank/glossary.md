# Glossary

Authoritative terminology. When terms conflict with casual usage, **this file wins**.

---

## Reward

Total amount received **if the round is won**.

```
Reward = Bet × Reward Multiplier
```

**Not** profit. **Not** capital. **Not** net gain.

---

## Profit

Net gain **if the round is won**.

```
Profit = Reward − Spent
```

Also written: `Reward - TotalSpent` at end of round.

Must satisfy profit constraints per profit mode (see `business-rules.md`).

---

## Spent

Accumulated bets through the current round (inclusive).

```
Spent = sum of all bets from round 1 to current round
```

Also called **Total Spent** in algorithms.

Strictly increasing across rounds (Invariant 4).

---

## Bet

Money placed in a single round.

Must be ≥ Minimum Bet. Must be multiple of Bet Step. Always rounded UP.

---

## Capital

Required bankroll — worst case if user **loses every round** through N.

```
Capital = sum of all bets in the plan
```

Same as `totalBankrollRequired` in summary.

---

## Strategy

A **deterministic list of bets** — one bet per round.

Not a gambling tactic. Not a prediction. A mathematical plan.

---

## Reward Multiplier

Fixed payout ratio. Example: 20 means reward is 20× bet.

```
Reward Multiplier > 1  (constraint)
```

---

## Bet Step

Minimum increment between valid bet amounts.

All bets must satisfy: `Bet mod Bet Step = 0`.

---

## Minimum Bet

Floor bet amount. No bet may be below this.

---

## Round

One betting attempt. Independent outcome from other rounds (domain assumption).

---

## Target Profit

User-defined profit goal. Meaning depends on Profit Mode:

| Mode              | Target Profit means |
| ----------------- | ------------------- |
| Break Even        | ignored (0)         |
| Fixed Profit      | absolute amount     |
| Percentage Profit | percentage of Spent |

---

## ROI

Return on investment ratio for a round if won.

```
ROI = Profit / Spent
```

Display metric — may use floating point. Monetary values use integers.

---

## Constraint Solver

Module that finds bets satisfying all invariants — not a "calculator" that guesses.

---

## Simulation

Deterministic replay: "what if win at round N?" — not Monte Carlo, not probability.
