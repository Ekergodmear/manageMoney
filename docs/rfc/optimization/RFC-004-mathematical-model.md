# RFC-004 — Optimization Mathematical Model

**Status:** Draft — blocked until RFC-003 accepted  
**Prerequisite:** [RFC-003 Domain](RFC-003-domain.md)  
**Next:** [RFC-005 Request](RFC-005-request.md)

---

## Purpose

Formalize what is optimized **without** changing the Core solver.

---

## Core solver (frozen on `main`)

```text
Given valid input I:
  find bet sequence minimizing Σ bet subject to feasibility constraints
```

---

## Optimization layer

```text
Given base I₀, constraints C, objective O, search space S (from RFC-002/003):
  find I* ∈ N(I₀, S) such that pipeline(I*) is feasible
  and O(I*) is optimal (or Pareto-optimal) among feasible neighbors in N
```

`pipeline(I) = validate → solve → buildStrategy → buildStatistics` — public API only.

`N(I₀, S)` = neighbors reachable by **accepted** knobs only (RFC-002).

---

## Objective metrics (from RFC-003 goals)

| Objective    | Metric source              |
| ------------ | -------------------------- |
| min bankroll | statistics / solver output |
| min max bet  | strategy rounds            |
| min avg bet  | strategy rounds            |
| ROI          | `buildStatistics`          |

Multi-objective handling: TBD in RFC-003 (weighted / lexicographic / Pareto).

---

## Hard constraints

```text
bankroll(I) ≤ B_max
maxBet(I) ≤ M_max
ROI(I) ≥ R_min
```

Feasibility: `validate(I)` and `solve(I)` both succeed.

---

## Correctness properties (Sprint 3.5)

- [ ] Every recommendation passes Core validation + solve
- [ ] Recommendations satisfy RFC-003 constraints
- [ ] Search terminates under declared bounds
- [ ] No dominated sole recommendation when better neighbor exists in N

---

## Non-goals

- Global optimum over unbounded continuous space
- Extending `solve()` optimality proof
- See [RFC-001 Non-goals](RFC-001-why-optimization.md)

---

## Open questions

- [ ] Discrete step sizes (profit decrement granularity)
- [ ] Max evaluations per request (performance budget)

---

## References

- [RFC-003 Domain](RFC-003-domain.md)
- [RFC-005 Request](RFC-005-request.md)
