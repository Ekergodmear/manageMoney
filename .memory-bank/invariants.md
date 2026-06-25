# Invariants

Properties that **must always hold** after every calculation.

After every Implement step, verify: **All invariants pass.**

Reference tests: `examples.md`, `test-cases.md`.

---

## Invariant 1 — Profit Target

For every round, if user wins that round:

```
Profit >= TargetProfit   (per profit mode definition)
```

Break Even: `Profit >= 0`  
Fixed Profit: `Profit >= targetProfit`  
Percentage Profit: `Profit >= Spent_before × (targetProfit / 100)`

---

## Invariant 2 — Minimum Bet

```
Bet >= MinimumBet
```

Every round. No exceptions.

---

## Invariant 3 — Bet Step Alignment

```
Bet mod BetStep = 0
```

Every round.

---

## Invariant 4 — Spent Strictly Increasing

```
Spent(round N) > Spent(round N-1)   for N > 1
```

Each round adds a positive bet. Spent never flatlines.

---

## Invariant 5 — Reward Formula

```
Reward = Bet × RewardMultiplier
```

Exact integer multiplication. Every round.

---

## Invariant 6 — No Floating Point Money Errors

All monetary fields (Bet, Reward, Spent, Profit) are integers.

No `0.30000000000000004`. No accumulated float drift.

ROI is the only field allowed to be non-integer.

---

## Invariant 7 — Deterministic Engine

```
same StrategyInput → same StrategyResult
```

Always. No randomness. No time dependency. No external state.

---

## Verification Checklist

After code changes, confirm:

- [ ] Invariant 1 — tested on all `examples.md` cases
- [ ] Invariant 2 — tested on Case 3 (min = step)
- [ ] Invariant 3 — tested on Case 8 (ceil rounding)
- [ ] Invariant 4 — tested on any multi-round plan
- [ ] Invariant 5 — tested on every round output
- [ ] Invariant 6 — tested on Case 6 (large values)
- [ ] Invariant 7 — run same input twice, compare deep equal

**If any invariant fails → task is NOT Done.**
