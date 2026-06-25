# RFC-004 — Optimization Mathematical Model

**Status:** ✅ **Accepted** (maintainer, 2026-06-25)  
**Prerequisite:** [RFC-003 Domain](RFC-003-domain.md) ✅  
**Next:** [RFC-005 Request](RFC-005-request.md) — ready for final review

---

## Purpose

Formalize **Minimal Change Optimization** — asymmetric distance from user intent, lexicographic order, nested search — without changing the Core solver.

RFC-003 defines the product goal. This RFC is the mathematical contract for Sprint 3.5 verification.

---

## Core solver (frozen on `main`)

```text
Given valid input I:
  find bet sequence minimizing Σ bet subject to feasibility constraints
```

Optimization **does not** replace or extend this objective.

---

## Search space (v1)

Optimization searches **only**:

| Dimension | Field                               |
| --------- | ----------------------------------- |
| Profit    | `targetProfit`                      |
| Rounds    | `rounds` (if `allowRoundReduction`) |

**Not searched** (RFC-002): `rewardMultiplier`, `minimumBet`, `betStep`, `profitMode`.

---

## Feasibility

```text
feasible(I, B_max) ≡
  validateCalculationRequest(I) succeeds
  ∧ solve(I) succeeds
  ∧ requiredBankroll(I) ≤ B_max
```

`F` = feasible set over candidates in `N(I₀, S)`:

```text
F = { I ∈ N(I₀, S) : feasible(I, B_max) }
```

If `F = ∅` → Optimization failure (`NO_FEASIBLE_SOLUTION`).

---

## Asymmetric distance (v1)

Distance is **not** symmetric absolute difference. Higher profit than intent is not penalized.

### profit_loss

```text
profit_loss(I₀, I) = max(0, targetProfit(I₀) − targetProfit(I))
```

| Original | Candidate | profit_loss     |
| -------- | --------- | --------------- |
| 100k     | 95k       | 5k              |
| 100k     | 120k      | **0** (not 20k) |

### round_loss

RFC-002 forbids increasing rounds. Candidates satisfy `rounds(I) ≤ rounds(I₀)`.

```text
round_loss(I₀, I) = rounds(I₀) − rounds(I)    (≥ 0 when candidate ≤ original)
```

| Original | Candidate | round_loss                              |
| -------- | --------- | --------------------------------------- |
| 50       | 48        | 2                                       |
| 50       | 52        | **invalid candidate** (excluded from N) |

### Distance vector

```text
d(I₀, I) = (profit_loss(I₀, I), round_loss(I₀, I))
```

**Not** a scalar. **Not** a weighted sum.

---

## Lexicographic order

Candidates are compared by **lexicographic order** on `(profit_loss, round_loss)`:

```text
Iₐ ≺ Iᵦ  iff
  profit_loss(I₀, Iₐ) < profit_loss(I₀, Iᵦ)
  ∨ (profit_loss(I₀, Iₐ) = profit_loss(I₀, Iᵦ)
     ∧ round_loss(I₀, Iₐ) < round_loss(I₀, Iᵦ))
```

Lower vector is better (closer to user intent).

### Ruled example (RFC-003)

| Candidate    | profit_loss | round_loss |
| ------------ | ----------- | ---------- |
| A: 95k, 50r  | 5_000       | 0          |
| B: 100k, 30r | 0           | 20         |

`B ≺ A` — compare first component: 0 < 5_000.

---

## Minimal feasible request (definition)

A request `I'` is a **minimal feasible request** (with respect to `I₀`, `B_max`, `S`) iff:

1. `feasible(I', B_max)`
2. There is no `J ∈ N(I₀, S)` such that `feasible(J, B_max)` and `J ≺ I'`

Equivalently: `I'` is **lexicographically optimal** in `F`.

This is a **mathematical definition**, not an algorithm.

---

## Nested search (normative v1 algorithm)

Search is **nested**, not a heuristic blend of knobs.

```text
profit ← targetProfit(I₀)

while profit ≥ profit_min:
  I ← copy(I₀) with targetProfit = profit
  if feasible(I, B_max):
    return I
  profit ← profit − profitGranularity

if allowRoundReduction:
  rounds ← rounds(I₀)
  while rounds ≥ rounds_min:
    profit ← targetProfit(I₀)
    while profit ≥ profit_min:
      I ← copy(I₀) with targetProfit = profit, rounds = rounds
      if feasible(I, B_max):
        return I
      profit ← profit − profitGranularity
    rounds ← rounds − 1

return NO_FEASIBLE_SOLUTION
```

**Order:** exhaust profit reductions at fixed rounds **before** decrementing rounds.

This implements Minimal Change: profit-only adjustment is tried before touching rounds.

---

## ProfitGranularity

Profit step size is **not** `betStep`. Bet step governs **bets**; profit granularity governs **domain search**.

```text
profitGranularity : positive integer   (e.g. 1000)
```

Declared on `OptimizationRequest` (RFC-005). Independent of solver internals.

### SearchBounds (internal — not public API)

OptimizationEngine derives search boundaries from `intent` + `profitGranularity` + validation rules:

```text
profit: targetProfit(I₀) → … → profit_min (derived)
rounds: rounds(I₀) → … → rounds_min (derived, if allowRoundReduction)
```

`profit_min` / `rounds_min` are **never** fields on `OptimizationRequest` (RFC-005).

---

## Optimization stability (determinism)

```text
∀ input X: optimize(X) = optimize(X)
```

Optimization **must be deterministic**. No random tie-breaking.

Same `OptimizationRequest` → same `OptimizationResult` on every run.

---

## Tie-breaking

When two candidates have **identical** `d(I₀, I)` (e.g. same profit and rounds but different internal strategy paths):

1. Core **Solver is deterministic** → same request yields same strategy
2. If multiple requests tie on distance, **first feasible wins** in nested search iteration order (highest profit, then highest rounds attempted first)

No random selection. Document iteration order in implementation; property tests verify stability.

---

## Monotonicity property

For fixed `I₀` and `S`, let `optimize(B_max)` return successful candidate `I*` (or failure).

```text
If B₁ > B₂  then  targetProfit(I*₁) ≥ targetProfit(I*₂)
```

Lowering `bankrollLimit` must not **increase** the recommended profit relative to a looser limit.

**Property-based test candidate** for Sprint 3.5.

(Intuition: tighter budget cannot justify a higher profit target in the minimal-change feasible solution.)

---

## Hard constraints (v1)

```text
requiredBankroll(I) ≤ B_max
```

`requiredBankroll` is **evaluated** via Core pipeline — not optimized directly (RFC-002 A6).

---

## Pipeline

```text
pipeline(I) = validateCalculationRequest → solve → buildStrategy → buildStatistics
```

`simulateWinAtRound` optional for explanation — read-only (RFC-002 A8).

---

## Correctness properties (Sprint 3.5)

- [ ] Success result `I* ∈ F`
- [ ] No `J ∈ F` with `J ≺ I*` (minimal feasible request)
- [ ] Nested search order matches normative algorithm
- [ ] `profit_loss` asymmetric; `round_loss` only for `rounds ≤ original`
- [ ] Optimization stability (determinism)
- [ ] Monotonicity w.r.t. `bankrollLimit`
- [ ] RFC-002 A12 monotonic steps on each knob
- [ ] Search terminates (`profit_min`, `rounds_min` bounds)

---

## Non-goals

- Weighted distance / scalarization
- Pareto optimality
- Continuous profit space
- Extending `solve()` proof

---

## References

- [RFC-002 Assumptions](RFC-002-assumptions.md)
- [RFC-003 Domain](RFC-003-domain.md)
- [RFC-005 Request](RFC-005-request.md)
