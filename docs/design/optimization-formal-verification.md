# Optimization — Formal Verification (Sprint 3.3)

**Status:** ✅ **FROZEN** — maintainer sign-off Sprint 3.3  
**Branch:** `optimization-v1`  
**Goal:** Evidence that `optimize()` matches RFC specification — not code aesthetics.

---

## Four confidence layers

| Level | Name                 | Purpose                                           | Status |
| ----- | -------------------- | ------------------------------------------------- | ------ |
| 1     | Contracts + Identity | DTO shape, identity axiom                         | ✅     |
| 2     | Property testing     | Monotonicity, prefix, round properties            | ✅     |
| 3     | Formal properties    | Determinism, minimal change, explanation, failure | ✅     |
| 4     | Differential         | `optimize()` vs brute-force oracle (bounded)      | ✅     |

Mutation testing (Stryker) — **deferred** (same as Solver Sprint 4).

---

## Level 1 — Contracts & identity

| ID   | Statement                                             | Test                            |
| ---- | ----------------------------------------------------- | ------------------------------- |
| O-C1 | `OptimizationRequest` / `OptimizationResult` contract | `optimization-contract.test.ts` |
| O-C2 | Identity: feasible intent → unchanged                 | `optimize-identity.test.ts`     |

---

## Level 2 — Sprint 3.2 property tests

| ID   | Statement                              | Test                                 |
| ---- | -------------------------------------- | ------------------------------------ |
| O-Pₚ | Monotonic budget                       | `optimize-profit-properties.test.ts` |
| O-Pₚ | Prefix stability + first feasible wins | `optimize-profit-properties.test.ts` |
| O-Pᵣ | Round monotonicity                     | `optimize-nested-properties.test.ts` |
| O-Pᵣ | Nested prefix (RFC-004 order)          | `optimize-nested-properties.test.ts` |

---

## Level 3 — Formal properties (Sprint 3.3B)

| ID   | Statement                                                  | Test                                 |
| ---- | ---------------------------------------------------------- | ------------------------------------ |
| O-P1 | `optimize(x) === optimize(x)` (1000 runs)                  | `optimize-formal-properties.test.ts` |
| O-P2 | No lexicographically better feasible candidate (bounded)   | `optimize-formal-properties.test.ts` |
| O-P3 | `profitReducedBy` / `roundsReducedBy` match request deltas | `optimize-formal-properties.test.ts` |
| O-P4 | `NO_FEASIBLE_SOLUTION` → empty feasible set (bounded)      | `optimize-formal-properties.test.ts` |

---

## Level 4 — Differential oracle (Sprint 3.3C)

Bounded search space (test-only):

| Bound                        | Value               |
| ---------------------------- | ------------------- |
| `roundCount`                 | ≤ 6                 |
| `targetProfit` (fixedAmount) | ≤ 50_000            |
| `profitGranularity`          | ∈ {1k, 2k, 5k, 10k} |

Oracle: enumerate all policy-aligned `(profit × rounds)` candidates → pick **lexicographic** optimum per RFC-004 → compare with `optimize()`.

| File                                                    | Role                  |
| ------------------------------------------------------- | --------------------- |
| `tests/support/brute-force-optimization.ts`             | Oracle implementation |
| `tests/support/optimization-arbitraries.ts`             | `fast-check` inputs   |
| `tests/unit/optimization/optimize.differential.test.ts` | 150 runs              |

---

## Architecture & policy (cross-cutting)

| Requirement                | Test                             |
| -------------------------- | -------------------------------- |
| No deep-import Core SDK    | `optimization-isolation.test.ts` |
| SearchPolicy pure / O(1)   | `search-policy.test.ts`          |
| Candidate builders pure    | `candidates.test.ts`             |
| Engine delegates to policy | `optimization-isolation.test.ts` |

---

## RFC compliance matrix

Full mapping: `docs/design/sprint-3.3-formal-verification.md` (§ 3.3A).

---

## Production readiness (Sprint 3.3D)

After all layers pass:

```text
Optimization Engine — Production Ready (experimental export)
```

- Module remains **internal** (`src/core/optimization/`) until public export ADR
- Core SDK `src/public/index.ts` **unchanged**
- Next product phase: **Stake Planner Web** (not engine features)

---

## References

- `docs/rfc/optimization/RFC-001-why-optimization.md` … `RFC-005-request.md`
- `docs/rfc/optimization/OPTIMIZATION-INVARIANTS.md`
- `docs/design/constraint-solver-formal-verification.md` (Solver precedent)
