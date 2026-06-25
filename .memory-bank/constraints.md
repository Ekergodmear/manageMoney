# Mathematical Constraints

Hard constraints on all inputs and outputs. AI must not guess — enforce exactly.

Reference: `business-rules.md`, `invariants.md`.

---

## Input Constraints

| Field             | Constraint                       | Invalid example       |
| ----------------- | -------------------------------- | --------------------- |
| Reward Multiplier | Must be **> 1** (strict)         | `0`, `1`, `-5`, `NaN` |
| Minimum Bet       | Must be **> 0**, integer         | `0`, `-1000`          |
| Bet Step          | Must be **> 0**, integer         | `0`, `-1`             |
| Minimum Bet       | Must be **multiple of** Bet Step | min=10500, step=1000  |
| Number of Rounds  | Must be **≥ 1**, integer         | `0`, `-1`, `1.5`      |
| Target Profit     | Must be **≥ 0**                  | `-100`                |
| Profit Mode       | Must be valid enum               | `"unknown"`           |

---

## Output Constraints (every round)

Enforced by `ConstraintSolver`. Verified against `invariants.md` after every implementation.

| Field  | Constraint                         |
| ------ | ---------------------------------- |
| Bet    | ≥ Minimum Bet                      |
| Bet    | `Bet mod Bet Step = 0`             |
| Bet    | Rounded UP to step (never floor)   |
| Reward | = Bet × Multiplier (exact integer) |
| Spent  | Strictly increasing                |
| Profit | ≥ TargetProfit (per profit mode)   |

---

## Integer Constraints

| Rule            | Detail                                        |
| --------------- | --------------------------------------------- |
| Monetary values | Integers only (Bet, Reward, Spent, Profit)    |
| No float money  | Never store 10000.5 as a bet                  |
| ROI exception   | ROI may be float for display                  |
| Safe integer    | Results must stay ≤ `Number.MAX_SAFE_INTEGER` |

---

## Determinism Constraints

| Rule           | Detail                       |
| -------------- | ---------------------------- |
| No random      | No `Math.random()`, no seeds |
| No probability | No win-rate assumptions      |
| Same input     | Always identical output      |

---

## Validation Responsibility

`ValidationEngine` rejects invalid **inputs** before solve.

`ConstraintSolver` guarantees valid **outputs** per invariants.

Tests must cover both layers separately.
