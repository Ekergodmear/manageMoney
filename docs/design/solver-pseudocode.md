# ConstraintSolver — Pseudo-code (Sprint 2.3B)

**Status:** **FROZEN** — approved 2025-06-25  
**Parent:** `docs/design/constraint-solver-algorithm.md` §6  
**Language:** Plain pseudo-code only — **no TypeScript**

Do not change without major version bump + new ADR.

Terminology: **PrimaryConstraint** (= math spec `ProfitConstraint`).

---

## 1. Trust boundary

ConstraintSolver **does not validate** (ADR-027).  
Input is always `ValidatedCalculationRequest` — **pure function over immutable input**.

---

## 2. Helpers

### RESOLVE_TARGET

```text
RESOLVE_TARGET(TP, AccumulatedSpentBefore) → P*

  // A7: P* depends on spent-before-round only — not win/loss history
  SWITCH TP.mode:
    CASE "breakEven":
      RETURN 0

    CASE "fixedAmount":
      RETURN TP.amount

    CASE "percentage":
      // Locked: % of AccumulatedSpentBeforeRound — see DOMAIN-LANGUAGE.md §TargetProfit
      RETURN FLOOR_DIV(AccumulatedSpentBefore × TP.percentage, 100)

    DEFAULT:
      IMPOSSIBLE    // validated input guarantees exhaustiveness — not a runtime branch
```

### Integer rounding

```text
CEIL_DIV(a, b):
  RETURN (a + b - 1) // b

CEIL_TO_STEP(numerator, denominator, step):
  raw_min ← CEIL_DIV(numerator, denominator)
  RETURN CEIL_DIV(raw_min, step) × step

SOLVE_MINIMAL_FEASIBLE_BET(AccumulatedSpentBefore, P*, M, B_min, S):
  // Solve PrimaryConstraint for minimal b ∈ D
  candidate ← CEIL_TO_STEP(AccumulatedSpentBefore + P*, M - 1, S)
  bet ← max(B_min, candidate)

  INVARIANT: bet ∈ D    // decision domain — see §3

  RETURN bet
```

---

## 3. Decision domain invariant

After `SOLVE_MINIMAL_FEASIBLE_BET`:

```text
bet ∈ D

where

  D = { B_min + k × S | k ∈ ℤ, k ≥ 0 }
```

Guaranteed by `CEIL_TO_STEP` + `max(B_min, …)` and validation (`B_min mod S = 0`).

---

## 4. State machine loop

```text
SOLVE(validated) → Strategy

  M     ← validated.rewardMultiplier
  B_min ← validated.minimumBet
  S     ← validated.betStep
  N     ← validated.roundCount
  TP    ← validated.targetProfit

  AccumulatedSpent ← 0    // AccumulatedSpentBeforeRound for round 1 (A₀)
  rounds ← []

  FOR i FROM 1 TO N:                    // explicit loop — not map/forEach/reduce

    AccumulatedSpentBefore ← AccumulatedSpent
    P_star ← RESOLVE_TARGET(TP, AccumulatedSpentBefore)
    bet    ← SOLVE_MINIMAL_FEASIBLE_BET(AccumulatedSpentBefore, P_star, M, B_min, S)
    reward ← bet × M
    AccumulatedSpentAfter ← AccumulatedSpentBefore + bet
    AccumulatedSpent ← AccumulatedSpentAfter   // next round's "before"

    // PrimaryConstraint: reward − AccumulatedSpentAfter ≥ P_star  (I1)
    // Equality holds iff bet = SOLVE_MINIMAL_FEASIBLE_BET(...) — local optimality
    //
    // Round.accumulatedSpent = AccumulatedSpentAfter (Aᵢ) — NOT "before"
    APPEND Round {
      index: i
      betAmount: bet
      rewardAmount: reward
      accumulatedSpent: AccumulatedSpentAfter
    }

  RETURN Strategy { rounds }
  // RequiredBankrollAmount = AccumulatedSpentAfter at round N = Σ betᵢ
```

State machine detail: `docs/design/constraint-solver-state-machine.md`.

---

## 5. Semantics locked (Sprint 2.3B)

| Topic                                  | Definition                                                                |
| -------------------------------------- | ------------------------------------------------------------------------- |
| **Percentage `P*`**                    | `floor(AccumulatedSpentBeforeRound × percentage / 100)`                   |
| **`Round.accumulatedSpent`**           | **After round** — inclusive sum through round `i` (`Aᵢ`)                  |
| **Solver variable `AccumulatedSpent`** | **Before next round** — equals `AccumulatedSpentBeforeRound` at loop head |

See `docs/DOMAIN-LANGUAGE.md` §TargetProfit, §AccumulatedSpent.

---

## 6. Postconditions

After `SOLVE`:

- I1–I8 (algorithm paper §7.2)
- Monotonicity: `AccumulatedSpentAfter(i) ≤ AccumulatedSpentAfter(i+1)`, `bet ≥ B_min` (§7.3)
- Every `bet ∈ D` (§3)

---

## 7. Module boundaries

**Must not import:** ValidationEngine, StrategyBuilder, StatisticsBuilder, Simulation, Optimization.

**Returns:** `Strategy` only — not `StrategyResult`.

**TypeScript (2.3E):** `for` loop only — ADR-031. Gate: `constraint-solver-implementation-checklist.md`.

---

## 8. Approval gate (2.3B)

- [x] Blocker 1 — percentage semantics locked
- [x] Blocker 2 — `Round.accumulatedSpent` = after round (`Aᵢ`)
- [x] `SOLVE_MINIMAL_FEASIBLE_BET`, domain invariant, RESOLVE_TARGET DEFAULT
- [x] User approved — **FROZEN** 2025-06-25
