# ConstraintSolver — Constructive Proof (Sprint 2.3D)

**Status:** **FROZEN** — approved 2025-06-25  
**Type:** Constructive proof — build solution step-by-step (not illustrative example)  
**Authority:** Frozen pseudo-code (2.3B), state machine (2.3C), math spec v2.0.0  
**Rule:** Arithmetic shown step-by-step — **no TypeScript**

Shared parameters unless noted:

```text
M = 20          rewardMultiplier
B_min = 10,000  minimumBet
S = 1,000       betStep
```

Helpers (frozen pseudo-code):

```text
CEIL_DIV(a, b)     = (a + b − 1) // b
CEIL_TO_STEP(n, d, S) = CEIL_DIV(CEIL_DIV(n, d), S) × S
P* fixed           = 100,000
P* breakEven       = 0
P* percentage      = floor(Aᵢ₋₁ × 10 / 100)
```

---

## Review checklist (2.3D)

| #   | Criterion              | Section | Status |
| --- | ---------------------- | ------- | ------ |
| 1   | Round 1                | §1      | ✓      |
| 2   | Intermediate round     | §2      | ✓      |
| 3   | Final round            | §3      | ✓      |
| 4   | Break-even             | §4      | ✓      |
| 5   | Percentage             | §5      | ✓      |
| 6   | Ceil rounding          | §6      | ✓      |
| 7   | Step rounding          | §7      | ✓      |
| 8   | Local optimality       | §8      | ✓      |
| 9   | Global optimality      | §9      | ✓      |
| 10  | Invariant preservation | §10     | ✓      |

---

## §1 Round 1 — fixedAmount

**Request:** `targetProfit = { mode: "fixedAmount", amount: 100_000 }`, `N ≥ 1`

```text
AccumulatedSpentBefore = A₀ = 0
P* = 100,000

PrimaryConstraint: b × 20 − (0 + b) ≥ 100,000
                 → b × 19 ≥ 100,000
                 → b ≥ 100,000 / 19 = 5,263.157…

CEIL_DIV(100,000, 19) = (100,000 + 18) // 19 = 5,264
CEIL_TO_STEP(100,000, 19, 1,000) = CEIL_DIV(5,264, 1,000) × 1,000 = 6 × 1,000 = 6,000

b₁ = max(10,000, 6,000) = 10,000
R₁ = 10,000 × 20 = 200,000
AccumulatedSpentAfter = A₁ = 0 + 10,000 = 10,000

π₁ = R₁ − A₁ = 200,000 − 10,000 = 190,000 ≥ 100,000 ✓
b₁ ∈ D ✓
```

**Constructed round 1:** `{ bet: 10,000, reward: 200,000, accumulatedSpent: 10,000 }`

---

## §2 Intermediate round — fixedAmount, round 12

**Same target;** forward-built state from rounds 1–11.

```text
AccumulatedSpentBefore = A₁₁ = 111,000
P* = 100,000

numerator = 111,000 + 100,000 = 211,000

CEIL_DIV(211,000, 19) = (211,000 + 18) // 19 = 11,106
CEIL_TO_STEP(211,000, 19, 1,000) = CEIL_DIV(11,106, 1,000) × 1,000 = 12 × 1,000 = 12,000

b₁₂ = max(10,000, 12,000) = 12,000
R₁₂ = 12,000 × 20 = 240,000
A₁₂ = 111,000 + 12,000 = 123,000

π₁₂ = 240,000 − 123,000 = 117,000 ≥ 100,000 ✓
```

**Note:** Bet increased from floor `10,000` to `12,000` because accumulated spent grew — constructive step exhibits non-constant bet sequence.

---

## §3 Final round — fixedAmount, N = 50

**Request:** `roundCount = 50`, `P* = 100,000` throughout.

Forward state after round 49:

```text
AccumulatedSpentBefore = A₄₉ = 1,439,000
P* = 100,000

numerator = 1,439,000 + 100,000 = 1,539,000

CEIL_DIV(1,539,000, 19) = (1,539,000 + 18) // 19 = 81,000   (exact)
CEIL_TO_STEP = 81,000   (already multiple of 1,000)

b₅₀ = max(10,000, 81,000) = 81,000
R₅₀ = 81,000 × 20 = 1,620,000
A₅₀ = 1,439,000 + 81,000 = 1,520,000

π₅₀ = 1,620,000 − 1,520,000 = 100,000 ≥ 100,000 ✓  (equality — local optimum)
```

**RequiredBankrollAmount** = `A₅₀` = **1,520,000** = `Σ bᵢ` for `i = 1..50`.

**5-round subset** (same parameters, `N = 5`): every `bᵢ = 10,000`, bankroll `50,000` — matches fixture `fixed-profit-x20-5-rounds.json`.

---

## §4 Break-even

**Request:** `targetProfit = { mode: "breakEven" }`, `N = 3`

```text
P* = 0 every round

Round 1: A₀ = 0
  CEIL_TO_STEP(0, 19, 1,000) = 0 → b₁ = max(10,000, 0) = 10,000
  R₁ = 200,000, A₁ = 10,000, π₁ = 190,000 ≥ 0 ✓

Round 2: A₁ = 10,000
  CEIL_TO_STEP(10,000, 19, 1,000) = 1,000 → b₂ = 10,000
  R₂ = 200,000, A₂ = 20,000, π₂ = 180,000 ≥ 0 ✓

Round 3: A₂ = 20,000
  b₃ = 10,000, A₃ = 30,000, π₃ = 170,000 ≥ 0 ✓
```

**RequiredBankrollAmount** = 30,000. Matches `break-even-x20-5-rounds.json` pattern for `N = 5` (all bets `10,000`).

---

## §5 Percentage

**Request:** `targetProfit = { mode: "percentage", percentage: 10 }`, `N = 3`

`P*ᵢ = floor(Aᵢ₋₁ × 10 / 100)` — **% of AccumulatedSpentBeforeRound** (locked).

| Round | Aᵢ₋₁   | P\* = floor(A×10/100) | bᵢ     | Rᵢ      | Aᵢ     | πᵢ                |
| ----- | ------ | --------------------- | ------ | ------- | ------ | ----------------- |
| 1     | 0      | 0                     | 10,000 | 200,000 | 10,000 | 190,000 ≥ 0 ✓     |
| 2     | 10,000 | 1,000                 | 10,000 | 200,000 | 20,000 | 180,000 ≥ 1,000 ✓ |
| 3     | 20,000 | 2,000                 | 10,000 | 200,000 | 30,000 | 170,000 ≥ 2,000 ✓ |

Round 2 detail:

```text
P* = floor(10,000 × 10 / 100) = floor(1,000) = 1,000
CEIL_TO_STEP(10,000 + 1,000, 19, 1,000) = CEIL_DIV(11,000/19) → 580 → 1,000
b₂ = max(10,000, 1,000) = 10,000 ✓
```

---

## §6 Ceil rounding (integer CEIL_DIV)

**Claim:** Bet sizing never uses floating-point; always rounds **up** toward +∞.

Round 1 fixedAmount (§1):

```text
Exact quotient: 100,000 / 19 = 5,263.157894…
CEIL_DIV(100,000, 19) = 5,264   (not 5,263 — never floor)
```

Round 12 (§2):

```text
211,000 / 19 = 11,105.263…
CEIL_DIV(211,000, 19) = 11,106
```

**If we used floor:** `b = 5,263` → `5,263 × 19 = 99,997 < 100,000` → **violates PrimaryConstraint**.  
Ceil guarantees constraint satisfaction (ADR-002).

---

## §7 Step rounding (CEIL_TO_STEP)

**Claim:** Result always `bᵢ ∈ D = { B_min + k×S | k ≥ 0 }`.

Round 12:

```text
CEIL_DIV(211,000, 19) = 11,106   (not on 1,000 grid)
CEIL_DIV(11,106, 1,000) × 1,000 = 12 × 1,000 = 12,000 ∈ D ✓
```

Round 50:

```text
CEIL_DIV(1,539,000, 19) = 81,000   (already on grid)
CEIL_TO_STEP = 81,000 ∈ D ✓
```

Invariant after every `SOLVE_MINIMAL_FEASIBLE_BET`: `bet ∈ D`.

---

## §8 Local optimality

**Claim:** For fixed `Aᵢ₋₁` and fixed `P*ᵢ`, greedy `bᵢ` is the **smallest** bet in `D` satisfying PrimaryConstraint.

Define profit if win at round `i`:

```text
f(b) = b × M − (Aᵢ₋₁ + b) = b × (M − 1) − Aᵢ₋₁
```

**Discrete strict monotonicity** (since `M > 1`):

```text
df/db = M − 1 > 0

⟹ for any b' = b + S  (next point on grid):

f(b') − f(b) = S × (M − 1) > 0

⟹ f(b + S) > f(b)
```

Valid bets require `f(b) ≥ P*` ⟺ `b ≥ (Aᵢ₋₁ + P*)/(M−1)`.

Greedy chooses:

```text
bᵢ^G = SOLVE_MINIMAL_FEASIBLE_BET(Aᵢ₋₁, P*ᵢ, M, B_min, S)
     = max(B_min, CEIL_TO_STEP(Aᵢ₋₁ + P*ᵢ, M − 1, S))
```

Any valid `b' < bᵢ^G` either violates `b' ∈ D`, or `b' < B_min`, or `f(b') < P*`.

**Equality:** `πᵢ = P*ᵢ` ⟺ `bᵢ` is the **minimal feasible bet** at round `i`.

**Constructive witness (round 50):** `π₅₀ = 100,000 = P*` exactly — `b₅₀` cannot decrease without violating PrimaryConstraint.

**∎**

---

## §9 Global optimality

**Theorem:** Under A1–A7, greedy minimizes `RequiredBankrollAmount = Σ bᵢ`.

Decisions are **not independent** across rounds: `Aᵢ = Aᵢ₋₁ + bᵢ`, so `bᵢ₊₁` depends on `bᵢ`.  
Global optimality therefore requires a **state monotonicity** argument — not only `∀i : bᵢ ≥ bᵢ^G` pointwise on unrelated strategies.

### Lemma 1 — Monotone minimal feasible bet

**Lemma 1a (profit increases with bet).**  
As in §8: `f(b + S) > f(b)` for `M > 1`.

**Lemma 1b (`P*` non-decreasing in spent-before).**  
For all modes on validated input:

| Mode          | `P*ᵢ = g(Aᵢ₋₁)`         | Monotone in `Aᵢ₋₁`? |
| ------------- | ----------------------- | ------------------- |
| `breakEven`   | `0`                     | constant ✓          |
| `fixedAmount` | `amount`                | constant ✓          |
| `percentage`  | `floor(Aᵢ₋₁ × p / 100)` | non-decreasing ✓    |

**Lemma 1c (threshold non-decreasing).**  
`h(A) = A + g(A)` is non-decreasing in `A` (sum of non-decreasing terms).

**Lemma 1d (`CEIL_TO_STEP` non-decreasing).**  
If `n ≤ n'` then `CEIL_TO_STEP(n, d, S) ≤ CEIL_TO_STEP(n', d, S)` — larger numerator cannot yield smaller aligned bet.

**Lemma 1 (main).**  
For fixed `ValidatedCalculationRequest` and round index `i`:

```text
If A ≤ A'  then  SOLVE_MINIMAL_FEASIBLE_BET(A, g(A), …) ≤ SOLVE_MINIMAL_FEASIBLE_BET(A', g(A'), …)
```

**Proof sketch:** `h(A) ≤ h(A')` → ceil-to-step threshold non-decreasing → `max(B_min, ·)` preserves order. **∎**

---

### Lemma 2 — Valid strategies produce monotone state

For any **valid** strategy producing bets `b₁, …, b_N`:

```text
A₀ = 0
Aᵢ = Aᵢ₋₁ + bᵢ     (definition)
```

If `bᵢ > 0` (guaranteed: `bᵢ ≥ B_min > 0`), then `Aᵢ > Aᵢ₋₁`.  
State is **strictly increasing** along any valid play.

---

### Theorem — Greedy globally optimal

Let `bᵢ^G` be greedy bets and `Aᵢ^G` greedy accumulated spent.  
Let `bᵢ'` be any **valid** alternative with accumulated `Aᵢ'`.

**Claim:** `Σ bᵢ' ≥ Σ bᵢ^G`.

**Proof by induction on round `i`:**

**Base (`i = 1`):** `A₀' = A₀^G = 0`. By §8 (local optimality), any valid `b₁'` satisfies `b₁' ≥ b₁^G`.

**Inductive step:** Assume `Aᵢ₋₁' ≥ Aᵢ₋₁^G`.  
Any valid `bᵢ'` must satisfy `bᵢ' ≥ SOLVE_MINIMAL_FEASIBLE_BET(Aᵢ₋₁', g(Aᵢ₋₁'), …)` (cannot be below minimal feasible).  
By **Lemma 1**: `SOLVE_MINIMAL_FEASIBLE_BET(Aᵢ₋₁', …) ≥ SOLVE_MINIMAL_FEASIBLE_BET(Aᵢ₋₁^G, …) = bᵢ^G`.  
Therefore `bᵢ' ≥ bᵢ^G`.

**Accumulated spent:**

```text
Aᵢ' = Aᵢ₋₁' + bᵢ' ≥ Aᵢ₋₁^G + bᵢ^G = Aᵢ^G
```

**Sum:** `Σ bᵢ' ≥ Σ bᵢ^G`. Greedy achieves equality. **∎**

**Constructive witness:** 50-round fixed-profit run — `RequiredBankrollAmount = 1,520,000`.

When A2/A3 break (max bankroll / max bet caps), OptimizationEngine (Sprint 3) replaces pure greedy.

---

## §10 Invariant preservation

After **each** transition `Tᵢ`, the following hold (verified on constructions §1–§5):

| ID  | Invariant                                         | Round 1 | Round 12 | Round 50 | breakEven | percentage |
| --- | ------------------------------------------------- | ------- | -------- | -------- | --------- | ---------- |
| I1  | `πᵢ ≥ P*`                                         | ✓       | ✓        | ✓ (eq)   | ✓         | ✓          |
| I2  | `bᵢ ≥ B_min`                                      | ✓       | ✓        | ✓        | ✓         | ✓          |
| I3  | `bᵢ mod S = 0`                                    | ✓       | ✓        | ✓        | ✓         | ✓          |
| I4  | `Aᵢ = Aᵢ₋₁ + bᵢ`; hence `Aᵢ > Aᵢ₋₁` when `bᵢ > 0` | —       | ✓        | ✓        | ✓         | ✓          |
| I5  | `Rᵢ = bᵢ × M`                                     | ✓       | ✓        | ✓        | ✓         | ✓          |
| I6  | integers                                          | ✓       | ✓        | ✓        | ✓         | ✓          |
| I7  | deterministic                                     | ✓       | ✓        | ✓        | ✓         | ✓          |
| I8  | `Aᵢ = Σ bₖ`                                       | ✓       | ✓        | ✓        | ✓         | ✓          |

**Transition preserves I1–I8** — state machine §9.

Sprint 2.3F will automate these checks on all fixtures.

---

## §11 Approval gate (2.3D)

- [x] Global optimality — Lemma 1 (monotone MFB) + Lemma 2 + Theorem (§9)
- [x] Step-by-step arithmetic — no code
- [x] User verified numbers
- [x] User approved — **FROZEN** 2025-06-25
- [x] Unlocks 2.3E TypeScript

---

## §12 References

- `docs/design/solver-pseudocode.md` (FROZEN)
- `docs/design/constraint-solver-state-machine.md` (FROZEN)
- `docs/MATHEMATICAL-SPECIFICATION.md` §11, §13
- `tests/fixtures/fixed-profit-x20-5-rounds.json`
- `docs/design/constraint-solver-implementation-checklist.md` (2.3E gate)
