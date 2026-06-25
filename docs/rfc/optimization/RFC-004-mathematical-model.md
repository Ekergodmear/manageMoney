# RFC-004 — Optimization Mathematical Model

**Status:** Draft — **ready for maintainer review** (RFC-003 accepted)  
**Prerequisite:** [RFC-003 Domain](RFC-003-domain.md) ✅  
**Next:** [RFC-005 Request](RFC-005-request.md)

---

## Purpose

Formalize **Minimal Change Optimization** — distance from user intent under hard constraints — without changing the Core solver.

RFC-003 defines the product goal. This RFC makes it precise.

---

## Core solver (frozen on `main`)

```text
Given valid input I:
  find bet sequence minimizing Σ bet subject to feasibility constraints
```

Optimization **does not** replace or extend this objective.

---

## Problem statement (v1)

Given:

- `I₀` — original request (user intent)
- `C` — hard constraints (e.g. `bankroll(I) ≤ B_max`)
- `S` — search space from RFC-002 (allowed knobs, monotonic directions)

Find:

```text
I* = argmin_{I ∈ F} distance(I₀, I)
```

where:

```text
F = { I ∈ N(I₀, S) : validate(I) ok ∧ solve(I) ok ∧ C satisfied }
```

`N(I₀, S)` = candidates reachable by monotonic knob changes (RFC-002 A12).

If `F = ∅` → Optimization failure (`No feasible solution`).

---

## Distance function (v1)

For candidates where only **decrease** is allowed on optimizable fields:

```text
profit_loss(I₀, I) = targetProfit(I₀) − targetProfit(I)   (≥ 0)
round_loss(I₀, I)    = rounds(I₀) − rounds(I)               (≥ 0)
```

Combined distance vector:

```text
d(I₀, I) = (profit_loss, round_loss)
```

**No weighted sum in v1.**

---

## Lexicographic order

Compare candidates `Iₐ`, `Iᵦ` by:

1. Minimize `profit_loss` — **Priority 1: preserve profit**
2. If tie, minimize `round_loss` — **Priority 2: preserve rounds**

```text
Iₐ ≺ Iᵦ  iff
  profit_loss(I₀, Iₐ) < profit_loss(I₀, Iᵦ)
  ∨ (profit_loss equal ∧ round_loss(I₀, Iₐ) < round_loss(I₀, Iᵦ))
```

### Ruled example (from RFC-003)

|              | profit_loss | round_loss |
| ------------ | ----------- | ---------- |
| A: 95k, 50r  | 5_000       | 0          |
| B: 100k, 30r | 0           | 20         |

`B ≺ A` — profit_loss 0 < 5_000.

---

## Minimal Change Principle (formal)

Among all `I ∈ F` that are optimal under `≺`, prefer the candidate that modifies the **fewest** knobs, then the **smallest** monotonic steps.

Implementation strategy (informative, not normative for v1):

1. Search profit reductions only until feasible or exhausted
2. Only if `allowRoundReduction` and profit-only search fails, introduce round reduction
3. Never adjust both knobs when one suffices

Exact algorithm → Sprint 3.3; this RFC defines **what** correct means.

---

## Hard constraints (v1)

```text
requiredBankroll(I) ≤ B_max    (from buildStatistics / solver output)
```

`requiredBankroll` is **evaluated**, not optimized directly (RFC-002 A6).

---

## Pipeline (unchanged)

```text
pipeline(I) = validateCalculationRequest → solve → buildStrategy → buildStatistics
```

Optional: `simulateWinAtRound` for explanation enrichment — read-only (RFC-002 A8).

---

## Correctness properties (Sprint 3.5)

- [ ] `I* ∈ F` when success
- [ ] No `I' ∈ F` with `I' ≺ I*` (lexicographic optimality)
- [ ] Minimal Change: no success result where a single-knob feasible neighbor is strictly closer
- [ ] Monotonic search per RFC-002 A12
- [ ] Search terminates under declared bounds

---

## Non-goals

- Pareto / multi-objective optimality
- Weighted distance
- Global optimum over continuous space
- Extending `solve()` proof

---

## Open questions (RFC-004)

- [ ] Profit decrement step size (discrete granularity)
- [ ] Max pipeline evaluations per request
- [ ] Tie-breaking when `d` identical (same vector) — rare with integer steps

---

## References

- [RFC-003 Domain](RFC-003-domain.md)
- [RFC-005 Request](RFC-005-request.md)
