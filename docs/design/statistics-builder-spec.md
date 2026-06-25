# StatisticsBuilder — Mapping Spec (Sprint 2.5)

**Status:** ✅ **FROZEN** — maintainer sign-off 2025-06-25  
**Authority:** ADR-035, ADR-028, ADR-034

---

## 1. Purpose

StatisticsBuilder is the **canonical derived data calculator** for `StrategyStatistics`.

```text
Strategy
      ↓
StatisticsBuilder   ← observational, never transformational
      ↓
StrategyStatistics
```

> **StatisticsBuilder is observational, never transformational.**  
> Observe → derive → return. Never fix, normalize, repair, or recalculate `Strategy`.

Symmetric with StrategyBuilder (ADR-034): boundary stability, not implementation complexity.

---

## 2. Scope (locked)

### In scope

- Compute `StrategyStatistics` from `Strategy` only
- Immutable **snapshot** — no live view on `Strategy`
- Builder contract supports empty `Strategy`

### Out of scope

- Create or mutate `Strategy`
- Read `CalculationRequest`, `ValidatedCalculationRequest`, or `Round[]` directly
- Call ConstraintSolver, ValidationEngine, Simulation, Optimization
- Prove or repair Strategy invariants
- `StrategyResult`, `StrategyWithStatistics`

### Future: SimulationEngine

SimulationEngine uses **`Strategy` only** — not `StrategyStatistics`.  
Statistics = reporting. Simulation = execution. No cross-dependency.

---

## 3. API

```typescript
function buildStatistics(strategy: Strategy): StrategyStatistics;
```

| Property | Value                                             |
| -------- | ------------------------------------------------- |
| Input    | `Strategy` — domain aggregate only                |
| Output   | `StrategyStatistics`                              |
| Errors   | None — pure function                              |
| Style    | No class, factory, `Result`, or request parameter |

---

## 4. Formulas (Strategy-only)

Let `R = strategy.rounds`, `N = R.length`, `last = R[N - 1]`.

All amounts: non-negative integers (`number` today). **BigInt → Sprint 2.7 SDK Hardening.**

StatisticsBuilder does **not** verify invariants (e.g. I8). It reads the aggregate as-is.

### 4.1 `roundCount`

```text
roundCount = N
```

Derived statistic — **allowed here**, forbidden on `StrategyBuilder` (ADR-034).

### 4.2 `requiredBankrollAmount`

```text
N = 0  →  0
N > 0  →  last.accumulatedSpent
```

Reads aggregate terminal state — **not** `Σ betAmount` (even if equal for solver-valid strategies).

### 4.3 `maximumBetAmount` / `minimumBetAmount`

```text
N = 0  →  0
N > 0  →  max / min of round.betAmount
```

**Commutative** — order-independent.

### 4.4 `averageBetAmount`

```text
N = 0  →  0
N > 0  →  floor( Σ round.betAmount / N )
```

**Commutative** — order-independent.

### 4.5 `expectedProfitAmount`

```text
N = 0  →  0
N > 0  →  last.rewardAmount − last.accumulatedSpent
```

> **`expectedProfitAmount` is terminal profit, not cumulative profit.**

Net profit if the **final round** in the aggregate is won. **Not** total profit across all rounds.

**Non-commutative** — depends on which round is last in the aggregate.

---

## 5. Empty strategy

| Contract | `rounds = []`              |
| -------- | -------------------------- |
| Pipeline | Never (`roundCount ≥ 1`)   |
| Builder  | Valid — all statistics `0` |

---

## 6. Immutable snapshot

```typescript
const statistics = buildStatistics(strategy);
// Mutating strategy afterward must NOT change statistics
```

---

## 7. Implementation

- Single **O(N)** `for` loop
- No intermediate collections
- No clone or mutation of `Strategy`
- One new `StrategyStatistics` object at return

Path: `src/core/statistics-builder/`

---

## 8. Tests

| ID    | Test                                                                                                                                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| T1    | Empty — all zeros                                                                                                                               |
| T2    | One round                                                                                                                                       |
| T3    | 50 rounds                                                                                                                                       |
| T4–T8 | Per-field formulas                                                                                                                              |
| T9    | Golden `Strategy` → JSON                                                                                                                        |
| T10   | Strategy unchanged after build                                                                                                                  |
| T11   | Snapshot independence after Strategy mutation                                                                                                   |
| T12   | Permutation: **commutative** stats (min, max, average) invariant; **requiredBankroll** and **expectedProfit** may change (depend on last round) |

Fixtures: `tests/fixtures/statistics-builder/*.golden.json`

---

## 9. Import boundary

**May import:** `@/core/models`

**Must not import:** ConstraintSolver, ValidationEngine, StrategyBuilder, Simulation, Optimization, Application

---

## References

- ADR-028, ADR-034, ADR-035
- `docs/DOMAIN-LANGUAGE.md`
- `docs/CONTRACTS.md` Contract 6b
