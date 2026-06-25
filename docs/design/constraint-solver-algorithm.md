# ConstraintSolver — Algorithm Paper

**Status:** §1–§4 **APPROVED** (2.3A) — 2025-06-25  
**Version:** 1.0.0  
**Authority:** `docs/MATHEMATICAL-SPECIFICATION.md` v2.0.0  
**Prerequisite:** ValidationEngine **FROZEN** (ADR-026)  
**Review standard:** Algorithm paper — not code review

This document is the authoritative design artifact for ConstraintSolver.  
Sprint gates reference sections here:

| Gate     | Section(s)                                     | Deliverable           |
| -------- | ---------------------------------------------- | --------------------- |
| **2.3A** | §1–§4                                          | Problem Definition ✅ |
| **2.3B** | §6 + `solver-pseudocode.md`                    | Pseudo-code           |
| **2.3C** | §5–§6 + `constraint-solver-state-machine.md`   | State Machine ✅      |
| **2.3D** | §7 + `constraint-solver-constructive-proof.md` | Constructive Proof    |
| **2.3E** | §10                                            | TypeScript            |
| **2.3F** | §7                                             | Formal Verification   |

---

## §1 Problem Definition

> **This is a constrained optimization problem over a discrete decision space.**

The solver finds a bet sequence that satisfies profit constraints at every round while minimizing total capital required. It is **not** a general arithmetic pipeline — it is discrete constrained optimization solved by a deterministic greedy state machine (§5–§6), not by search.

### Given

A validated calculation request with:

| Symbol  | Field              | Meaning                         |
| ------- | ------------------ | ------------------------------- |
| `M`     | `rewardMultiplier` | Reward multiplier (`M > 1`)     |
| `N`     | `roundCount`       | Number of rounds                |
| `B_min` | `minimumBet`       | Floor bet per round             |
| `S`     | `betStep`          | Bet increment (discrete grid)   |
| `TP`    | `targetProfit`     | Profit target mode + parameters |

At each round `i ∈ {1, …, N}`, define:

- `P*ᵢ` — target profit if win at round `i` (from `TP` and **AccumulatedSpentBeforeRound**)
- `Aᵢ₋₁` — **AccumulatedSpentBeforeRound** (`A₀ = 0`)
- `Aᵢ` — **AccumulatedSpentAfterRound** = `Aᵢ₋₁ + bᵢ`
- `Rᵢ = bᵢ × M` — reward if round `i` wins

**Percentage mode (locked):**  
`P*ᵢ = floor(Aᵢ₋₁ × percentage / 100)` — percentage of **spent before round `i`**, not RequiredBankroll, not current bet. See `docs/DOMAIN-LANGUAGE.md` §TargetProfit.

### Find

A bet sequence:

```text
b₁, b₂, …, b_N
```

### Subject to

**Primary Constraint** at every round `i` (see §6; Optimization Sprint 3 may add Secondary / Soft constraints):

```text
PrimaryConstraint(i):

  Rᵢ − (Aᵢ₋₁ + bᵢ)  ≥  P*ᵢ

Equivalently:

  πᵢ = Rᵢ − Aᵢ  ≥  P*ᵢ     where     Aᵢ = Aᵢ₋₁ + bᵢ
```

Additional feasibility:

- `bᵢ ∈ D` — discrete decision domain (§4)
- All amounts are positive integers

> **Terminology:** `PrimaryConstraint` is the canonical name in this paper.  
> Math spec §3.1 uses `ProfitConstraint` — same formula, legacy alias until math spec v2.1.

### Objective

```text
Minimize

  RequiredBankrollAmount

  =

  Σ bᵢ     for i = 1..N
```

`RequiredBankrollAmount` is the domain term for total capital required to execute all `N` rounds (`docs/DOMAIN-LANGUAGE.md`).

---

## §2 Assumptions

| ID  | Assumption                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | Round `i` depends only on `Aᵢ₋₁` and request parameters — no look-ahead                                                                    |
| A2  | **No maximum bankroll cap**                                                                                                                |
| A3  | **No maximum bet cap** (only `B_min` floor and step)                                                                                       |
| A4  | **No transaction fees, tax, or bonus** — `Rᵢ = bᵢ × M` exactly                                                                             |
| A5  | Objective: minimize `RequiredBankrollAmount = Σ bᵢ` subject to PrimaryConstraint at every round                                            |
| A6  | **Decision space is discrete** — every `bᵢ ∈ D`; bet sizing uses integer ceil-to-step (§8)                                                 |
| A7  | **Target profit is path-independent of win/loss** — `P*ᵢ` depends on `TP` and `Aᵢ₋₁` only, not on whether previous rounds were won or lost |

A7 preserves correctness if adaptive strategies are added later: target at round `i` is defined by spent-before-round, not by outcome history.

When A2, A3, or payout rules change, see OptimizationEngine (Sprint 3) or update PrimaryConstraint definition.

---

## §3 Objective Function

```text
Minimize

  RequiredBankrollAmount

  =

  Σ bᵢ     for i = 1..N

subject to

  PrimaryConstraint(i)   for all i = 1..N

  πᵢ ≥ P*ᵢ

where

  πᵢ = bᵢ × M − Aᵢ
  Aᵢ = Aᵢ₋₁ + bᵢ
  P*ᵢ = RESOLVE_TARGET(TP, Aᵢ₋₁)
  bᵢ ∈ D
```

Under A1–A7, the greedy algorithm (§6) achieves the global minimum of `RequiredBankrollAmount`.  
Proof: §7.3 (Optimality).

---

## §4 Decision Variable

```text
Decision variable:

  bᵢ   — bet amount at round i
```

```text
Domain:

  bᵢ ∈ D

where

  D = { B_min + k × S | k ∈ ℤ, k ≥ 0 }
```

This is the exact **discrete decision space**: bets on the grid `{B_min, B_min + S, B_min + 2S, …}`.

Equivalent form when `B_min mod S = 0` (validated): `D = { k × S | k ∈ ℤ, k ≥ B_min / S }`.

All other quantities are **derived** from `bᵢ` and state:

| Derived | Formula     |
| ------- | ----------- |
| `Rᵢ`    | `bᵢ × M`    |
| `Aᵢ`    | `Aᵢ₋₁ + bᵢ` |
| `πᵢ`    | `Rᵢ − Aᵢ`   |

---

## §5 State

ConstraintSolver is a **state machine** with one scalar state variable:

```text
AccumulatedSpentBeforeRound(i) = Aᵢ₋₁
```

Initial:

```text
AccumulatedSpentBeforeRound(1) = A₀ = 0
```

Per round, two explicit values:

```text
AccumulatedSpentBefore ← Aᵢ₋₁
… transition …
AccumulatedSpentAfter  ← Aᵢ = Aᵢ₋₁ + bᵢ
```

Next round: `AccumulatedSpentBeforeRound(i+1) ← AccumulatedSpentAfter`.

**`Round.accumulatedSpent` (locked):** stores **`AccumulatedSpentAfterRound`** (`Aᵢ`), not before.  
Field name unchanged for API stability — semantics in `docs/DOMAIN-LANGUAGE.md` §AccumulatedSpent.

Everything else is derived:

```text
P*ᵢ  ← RESOLVE_TARGET(TP, AccumulatedSpentBefore)
bᵢ   ← SOLVE_MINIMAL_FEASIBLE_BET(AccumulatedSpentBefore, P*ᵢ, M, B_min, S)
Rᵢ   ← bᵢ × M
```

No other hidden state. No backtracking.

See `docs/design/constraint-solver-state-machine.md` — **StateBefore** and **StateAfter** nodes.

---

## §6 Transition Function

Per-round transition (round `i`):

```text
TRANSITION(AccumulatedSpentBefore, validated, i):

  P_star ← RESOLVE_TARGET(validated.targetProfit, AccumulatedSpentBefore)
  b      ← SOLVE_MINIMAL_FEASIBLE_BET(AccumulatedSpentBefore, P_star, M, B_min, S)
  R      ← b × M
  AccumulatedSpentAfter ← AccumulatedSpentBefore + b

  // PrimaryConstraint: R − AccumulatedSpentAfter ≥ P_star
  // Equality achievable iff b is the minimal feasible bet (local optimality)

  EMIT Round {
    index: i
    betAmount: b
    rewardAmount: R
    accumulatedSpent: AccumulatedSpentAfter    // Aᵢ — after round, not before
  }

  RETURN AccumulatedSpentAfter    // becomes next round's "before"
```

### RESOLVE_TARGET

```text
RESOLVE_TARGET(TP, AccumulatedSpentBefore) → P*

  CASE breakEven:    RETURN 0
  CASE fixedAmount:  RETURN TP.amount
  CASE percentage:   RETURN floor(AccumulatedSpentBefore × TP.percentage / 100)
  DEFAULT:           IMPOSSIBLE   // validated exhaustiveness — not runtime
```

### SOLVE_MINIMAL_FEASIBLE_BET

```text
SOLVE_MINIMAL_FEASIBLE_BET(A, P*, M, B_min, S):

  candidate ← CEIL_TO_STEP(A + P*, M - 1, S)
  bet       ← max(B_min, candidate)

  INVARIANT: bet ∈ D

  RETURN bet
```

Full loop: `docs/design/solver-pseudocode.md`.

---

## §7 Proof

### 7.1 Termination

**Claim:** The algorithm always terminates after exactly `N` iterations.

**Proof:**

1. Input `N = roundCount` is a positive integer (guaranteed by ValidationEngine).
2. Loop runs `FOR i = 1 TO N` — fixed iteration count.
3. Each iteration performs O(1) integer arithmetic — no recursion, no unbounded loop.
4. Therefore termination occurs after exactly `N` steps. **∎**

### 7.2 Correctness

**Claim:** After each round `i`, invariants I1–I8 hold.

| ID  | Invariant                                                                 | Holds because                                                                              |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| I1  | `πᵢ ≥ P*ᵢ` (PrimaryConstraint)                                            | `SOLVE_MINIMAL_FEASIBLE_BET` — minimal feasible `b`; equality iff `b = b*` (local optimum) |
| I2  | `bᵢ ≥ B_min`                                                              | explicit `max(B_min, candidate)`                                                           |
| I3  | `bᵢ mod S = 0`                                                            | `CEIL_TO_STEP` + `bᵢ ∈ D`                                                                  |
| I4  | `Aᵢ = Aᵢ₋₁ + bᵢ`; hence `Aᵢ > Aᵢ₋₁` when `bᵢ > 0` (validated `B_min > 0`) |
| I5  | `Rᵢ = bᵢ × M`                                                             | direct multiplication                                                                      |
| I6  | all integers                                                              | integer-only path (§8)                                                                     |
| I7  | deterministic                                                             | no randomness, no I/O (§9)                                                                 |
| I8  | `Aᵢ = Σ bₖ`                                                               | state update `A ← A + b` each step                                                         |

Sprint 2.3F tests assert I1–I8 on every fixture.

### 7.3 Monotonicity

**Claim:** Accumulated spent is non-decreasing; every bet meets the minimum.

```text
Aᵢ ≤ Aᵢ₊₁     for all i = 1..N−1
bᵢ ≥ B_min    for all i = 1..N
```

**Proof:**

1. By construction, `Aᵢ₊₁ = Aᵢ + bᵢ₊₁`.
2. Validation guarantees `B_min > 0` and `bᵢ₊₁ ≥ B_min` (I2).
3. Therefore `Aᵢ₊₁ = Aᵢ + bᵢ₊₁ ≥ Aᵢ` — accumulated spent is **monotone non-decreasing**.
4. `bᵢ ≥ B_min` holds directly from I2 at every round. **∎**

Used in formal verification (2.3F) to assert state-machine progression without re-deriving from scratch.

### 7.4 Optimality

**Local optimality:**  
`f(b) = b×(M−1) − Aᵢ₋₁`. Discrete strict increase: `f(b + S) = f(b) + S×(M−1) > f(b)`.  
Greedy `bᵢ^G = SOLVE_MINIMAL_FEASIBLE_BET(…)` is minimal in `D`. Equality `πᵢ = P*ᵢ` iff minimal feasible.

**Global optimality (Lemma 1 → Lemma 2 → Theorem):**

- **Lemma 1:** `SOLVE_MINIMAL_FEASIBLE_BET(A, g(A), …)` is non-decreasing in `A` (`g` = `RESOLVE_TARGET`; non-decreasing for all modes).
- **Lemma 2:** Valid play gives `Aᵢ = Aᵢ₋₁ + bᵢ` with `bᵢ > 0` → strictly increasing state.
- **Theorem:** By induction: `Aᵢ₋₁' ≥ Aᵢ₋₁^G` ⇒ `bᵢ' ≥ bᵢ^G` ⇒ `Σ bᵢ' ≥ Σ bᵢ^G`.

Full proof: `docs/design/constraint-solver-constructive-proof.md` §8–§9.

---

## §8 Numerical Stability

### Rounding

| Operation                   | Policy                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| Bet sizing `(A + P*)/(M−1)` | Integer `CEIL_DIV` then `CEIL_TO_STEP` — never float                                                    |
| Percentage `P*`             | `floor(AccumulatedSpentBeforeRound × percentage / 100)` — **not** RequiredBankroll, **not** current bet |
| Bet direction               | Always **ceil** toward +∞ (ADR-002)                                                                     |

Reference:

```text
CEIL_DIV(a, b) = (a + b - 1) // b
CEIL_TO_STEP(n, d, S) = CEIL_DIV(CEIL_DIV(n, d), S) × S
```

### Overflow

| Topic               | Policy                                                                         |
| ------------------- | ------------------------------------------------------------------------------ |
| Overflow in solver  | **Not considered** — ValidationEngine rejects unsafe intermediates (M002)      |
| Current amount type | `number` (IEEE-754 safe integer range)                                         |
| Migration path      | `bigint` / Decimal module — rounding policy moves; PrimaryConstraint unchanged |

ConstraintSolver **must not** re-check overflow. Invalid input reaching the solver is a ValidationEngine defect (ADR-027).

---

## §9 Determinism

```text
For identical ValidatedCalculationRequest input,
ConstraintSolver must always generate identical Strategy output.
```

Requirements:

- Pure function — no I/O, no `Date`, no `Math.random`, no env reads
- Integer-only monetary arithmetic
- Fixed iteration order `i = 1..N`
- No parallelism (round `i` depends on `Aᵢ₋₁`)

Invariant I7 is the testable form of this guarantee.

---

## §10 ConstraintSolver Contract

> **ConstraintSolver is a pure function over immutable input.**

It reads `ValidatedCalculationRequest` and returns `Strategy`. It never mutates input, never reads external state, and never performs side effects.

### Public API

```typescript
function solve(validated: ValidatedCalculationRequest): Result<Strategy, SolverError>;
```

### Returns

**`Strategy` only** — `{ rounds: readonly Round[] }`.

Does **not** return:

- `StrategyResult`
- `StrategyStatistics`
- `ValidationResult`
- metadata

Statistics belong to **StatisticsBuilder** (Sprint 2.5).  
Assembly into `StrategyResult` belongs to **application layer**.

### Implementation rule (2.3E — ADR-031)

Inside `src/core/solver/**`:

- Use explicit `for` loop for the round state machine
- **Forbidden:** `forEach`, `reduce`, `map` on the solver hot path

Rationale: sequential state machine — easier to prove, debug, benchmark, and avoid extra allocation.

### Responsibilities

| Module                | Responsibility                                                  |
| --------------------- | --------------------------------------------------------------- |
| **ConstraintSolver**  | Calculate bet sequence → `Strategy`                             |
| **StrategyBuilder**   | Transform / normalize sequence → domain `Strategy` (Sprint 2.4) |
| **StatisticsBuilder** | Compute derived metrics → `StrategyStatistics` (Sprint 2.5)     |
| **Application**       | Orchestrate → `StrategyResult`                                  |

### Pipeline

```text
ValidatedCalculationRequest
     ↓
ConstraintSolver          → Strategy
     ↓
StrategyBuilder           → Strategy (normalized)
     ↓
StatisticsBuilder         → StrategyStatistics
     ↓
Application               → StrategyResult
```

### Trust boundary (ADR-027)

ConstraintSolver **does not validate** input.  
It **does not import** ValidationEngine, StrategyBuilder, StatisticsBuilder, Simulation, or Optimization.

### Module imports (allowed)

```text
ValidatedCalculationRequest   (@/application/dto)
Round, Strategy               (@/core/models)
```

---

## §11 Approval Gate

| Gate                            | Status                       |
| ------------------------------- | ---------------------------- |
| 2.3A Problem Definition (§1–§4) | ✅ **APPROVED** — 2025-06-25 |
| 2.3B Pseudo-code                | ✅ **FROZEN** — 2025-06-25   |
| 2.3C State Machine              | ✅ **FROZEN** — 2025-06-25   |
| 2.3D Constructive Proof         | ✅ **FROZEN** — 2025-06-25   |
| 2.3E TypeScript                 | ✅ **FROZEN** — 2025-06-25   |
| 2.3F Formal Verification        | In progress                  |

---

## §12 References

- `docs/MATHEMATICAL-SPECIFICATION.md` v2.0.0
- `docs/design/solver-pseudocode.md`
- `docs/design/constraint-solver-state-machine.md`
- `docs/SOLVER-CODING-RULES.md`
- ADR-027, ADR-028, ADR-029, ADR-030, ADR-031, ADR-032
