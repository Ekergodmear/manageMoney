# ConstraintSolver — Implementation Checklist (Sprint 2.3E)

**Status:** **FROZEN** — approved 2025-06-25  
**Authority:** Frozen pseudo-code (2.3B), state machine (2.3C), constructive proof (2.3D)  
**Path:** `src/core/solver/**`

**Rule (ADR-032):** Implementation changes require spec update through design gate first.

---

## Purity & trust boundary

- [x] `solve()` is pure — no I/O, `Date`, `Math.random`, env reads
- [x] Does **not** mutate `ValidatedCalculationRequest`
- [x] Does **not** re-validate — ADR-027
- [x] Does **not** import ValidationEngine, StrategyBuilder, StatisticsBuilder, Simulation, Optimization

---

## Arithmetic

- [x] **No floating-point** on money path — integer helpers only
- [x] `ceilDiv` / `ceilToStep` / `floorDiv` match pseudo-code
- [x] Percentage `P*` = `floor(accumulatedSpentBefore × percentage / 100)`

---

## State machine

- [x] Explicit `for` loop — no `map` / `reduce` / `forEach` on hot path (ADR-031)
- [x] Sole loop state: `accumulatedSpent`
- [x] `accumulatedSpentAfter = accumulatedSpentBefore + bet`
- [x] `Round.accumulatedSpent` stores **after** round (`Aᵢ`)

---

## 1:1 naming (mandatory)

- [x] `accumulatedSpentBefore` / `accumulatedSpentAfter`
- [x] `resolveTarget()` / `solveMinimalFeasibleBet()`
- [x] `ceilDiv()` / `ceilToStep()` / `floorDiv()`
- [x] Logic mirrors frozen pseudo-code

---

## Output contract

- [x] Returns `Result<Strategy, SolverError>` — `Strategy` only
- [x] No statistics, no metadata inside solver
- [x] `SolverError = never` (review in 2.3F)

---

## Tests

- [x] Golden master — byte-stable JSON
- [x] Invariants I1–I8 + constructive checkpoints
- [x] Architecture isolation tests
- [x] `pnpm verify` passes (112 tests)

---

## Sign-off

| Role        | Date       | Status                |
| ----------- | ---------- | --------------------- |
| Implementer | 2025-06-25 | Complete              |
| Reviewer    | 2025-06-25 | **Approved — FROZEN** |

Sprint 2.3F: property-based tests + extended formal verification.
