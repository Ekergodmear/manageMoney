# ConstraintSolver — Formal Verification (Sprint 2.3F)

**Status:** ✅ **FROZEN** — maintainer sign-off 2025-06-25  
**Goal:** Increase **confidence** that implementation matches specification.

**ConstraintSolver:** Production Ready — Stable Core (ADR-033)

---

## Four confidence layers

| Level | Name                 | Purpose                                   | Status                           |
| ----- | -------------------- | ----------------------------------------- | -------------------------------- |
| 1     | Invariants           | I1–I8 on known fixtures                   | ✅ `invariants.test.ts`          |
| 2     | Property testing     | `fast-check` P1–P8 on random valid inputs | ✅ `solver.properties.test.ts`   |
| 3     | Differential testing | Greedy vs brute-force oracle (N ≤ 5)      | ✅ `solver.differential.test.ts` |
| 4     | Mutation             | Stryker — **Sprint 4**, not 2.3F          | Planned                          |

---

## Level 1 — Invariants (automated I1–I8)

`tests/unit/solver/invariants.test.ts` + golden fixtures.

| ID  | Property                                     |
| --- | -------------------------------------------- |
| I1  | `profit ≥ P*` (PrimaryConstraint)            |
| I2  | `bet ≥ minimumBet`                           |
| I3  | `bet mod betStep = 0`                        |
| I4  | `Aᵢ = Aᵢ₋₁ + bᵢ` → `Aᵢ > Aᵢ₋₁` when `bᵢ > 0` |
| I5  | `reward = bet × M`                           |
| I6  | all integers                                 |
| I7  | deterministic                                |
| I8  | `accumulatedSpent = Σ bets through round`    |

---

## Level 2 — Property-based testing (`fast-check`)

Generate **valid** `CalculationRequest` inputs (filtered through `validateCalculationRequest`) → `solve`.

Default: **2 000 runs** per property in CI. Profiles via `pnpm test:property` (10 000) and `pnpm test:property:stress` (50 000). See `docs/RELEASE-RULES.md`.

| Property | Statement                                                          |
| -------- | ------------------------------------------------------------------ |
| P1       | `solve(x) === solve(x)` (determinism)                              |
| P2       | `strategy.rounds.length === request.roundCount`                    |
| P3       | `Aᵢ₊₁ ≥ Aᵢ` (monotonic accumulatedSpent)                           |
| P4       | PrimaryConstraint every round (I1)                                 |
| P5       | `bet ∈ D` (domain: aligned step, ≥ minimumBet)                     |
| P6       | Higher `fixedAmount` target → `requiredBankroll` does not decrease |
| P7       | Higher `minimumBet` → every bet does not decrease                  |
| P8       | Larger `betStep` → every bet remains in new domain D               |

**Files:**

- `tests/support/solver-arbitraries.ts`
- `tests/unit/solver/solver.properties.test.ts`

---

## Level 3 — Differential testing

Slow brute-force oracle (`tests/support/brute-force-solver.ts`) for **N ≤ 5** only.

Compare greedy `solve()` vs exhaustive minimum-bankroll search:

- Total bankroll (Σ bets) must match
- Full bet sequence must match

**File:** `tests/unit/solver/solver.differential.test.ts` (150 runs per property, `MAX_EXTRA_STEPS = 12`)

---

## Level 4 — Golden master (2.3E — maintain)

```text
validate(request) → solve() → JSON.stringify(Strategy) === golden
```

Fixtures: `tests/fixtures/solver/*.golden.json`

Any intentional behavior change → update golden + ADR if algorithm change.

---

## Level 5 — Mutation testing

**Sprint 4** — Stryker on `src/core/validation/**` and `src/core/solver/**`.

---

## SolverError decision (2.3F review)

**Current:** `Result<Strategy, SolverError>` where `SolverError = never`.

**Finding:** Property tests over 2 000+ valid inputs show `solve(validated)` always succeeds. Constructive proof (2.3D) guarantees feasibility for validated input.

**Decision:** **Keep current API.** `Result<Strategy, never>` documents the contract without a breaking change. Do not narrow to `solve(): Strategy` solely for aesthetics — revisit only if a real error branch is introduced.

---

## StatisticsBuilder boundary

`requiredBankrollAmount` is computed **only** in StatisticsBuilder — not in ConstraintSolver.

Solver maintains `accumulatedSpentAfter` on each `Round`.  
`RequiredBankrollAmount` = final round's `accumulatedSpent` — derived in StatisticsBuilder.

---

## Test layout

```text
tests/support/
  solver-test-helpers.ts
  solver-arbitraries.ts
  brute-force-solver.ts

tests/unit/solver/
  golden-master.test.ts       ✅ 2.3E
  invariants.test.ts          ✅ Level 1
  solver.properties.test.ts   ✅ Level 2
  solver.differential.test.ts ✅ Level 3
```

---

## References

- `docs/design/constraint-solver-state-machine.md` §5–§6, §9
- `docs/design/constraint-solver-constructive-proof.md` (FROZEN)
- `docs/SOLVER-CODING-RULES.md`
- ADR-032 Specification Supremacy
