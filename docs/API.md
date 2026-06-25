# Stake Planner — API Reference

**Version:** 1.0  
**Status:** Draft (Phase 1 — Core Engine)  
**Last Updated:** 2025-06-25

This document describes the public API of the constraint optimization engine (`src/core`).

**Module map:** see `.memory-bank/system-map.md`

| Module             | Path                           | Primary export            |
| ------------------ | ------------------------------ | ------------------------- |
| StrategyGenerator  | `src/core/strategy-generator/` | `generateStrategy()`      |
| ConstraintSolver   | `src/core/solver/`             | `solveAll()` (internal)   |
| ValidationEngine   | `src/core/validation/`         | `validateStrategyInput()` |
| SimulationEngine   | `src/core/simulation/`         | `simulateWinAtRound()`    |
| OptimizationEngine | `src/core/optimization/`       | `findMinimumBankroll()`   |
| ReportGenerator    | `src/core/report/`             | `toCsv()`                 |

There is no HTTP API in Phase 1. All functions are synchronous and pure.

---

## Module: `@/core/strategy-generator`

### Types

#### `ProfitMode`

```typescript
type ProfitMode = 'break-even' | 'fixed-profit' | 'percentage-profit';
```

Profit mode determines how `desiredProfit` is computed at each round.

| Value                 | `desiredProfit` formula             |
| --------------------- | ----------------------------------- |
| `'break-even'`        | `0`                                 |
| `'fixed-profit'`      | `targetProfit` (fixed amount)       |
| `'percentage-profit'` | `totalSpent × (targetProfit / 100)` |

---

#### `StrategyInput`

```typescript
interface StrategyInput {
  /** Payout ratio: reward = bet × rewardMultiplier. Must be > 1. */
  rewardMultiplier: number;

  /** Minimum allowed bet. Must be ≥ betStep and > 0. */
  minimumBet: number;

  /** Bet increment. All bets must be multiples of this value. Must be > 0. */
  betStep: number;

  /** Number of rounds to calculate. Must be ≥ 1. */
  numberOfRounds: number;

  /** How desired profit is computed each round. */
  profitMode: ProfitMode;

  /**
   * Target profit value.
   * - break-even: ignored (use 0)
   * - fixed-profit: absolute amount
   * - percentage-profit: percentage of totalSpent
   */
  targetProfit: number;
}
```

---

#### `RoundResult`

```typescript
interface RoundResult {
  /** Round number, 1-indexed. */
  round: number;

  /** Recommended bet for this round (rounded up, aligned to betStep, ≥ minimumBet). */
  bet: number;

  /** Potential reward if win occurs: bet × rewardMultiplier. */
  reward: number;

  /** Cumulative total spent through this round (inclusive). */
  spent: number;

  /** Net profit if win occurs this round: reward - spent. */
  profit: number;

  /** Return on investment if win occurs: profit / spent. */
  roi: number;
}
```

---

#### `StrategySummary`

```typescript
interface StrategySummary {
  /** Sum of all bets through the last round (worst-case bankroll needed). */
  totalBankrollRequired: number;

  /** Largest single bet in the plan. */
  maxSingleBet: number;

  /** Profit if win occurs on the final round. */
  finalRoundProfit: number;

  /** ROI if win occurs on the final round. */
  finalRoundRoi: number;
}
```

---

#### `StrategyResult`

```typescript
interface StrategyResult {
  /** Per-round calculation results. Length equals numberOfRounds. */
  rounds: RoundResult[];

  /** Aggregated summary metrics. */
  summary: StrategySummary;
}
```

---

### Functions

#### `generateStrategy(input: StrategyInput): StrategyResult`

Main public entry point. Validates input, runs ConstraintSolver, returns plan.

**Algorithm:** Follows `.memory-bank/algorithms.md` exactly (implemented in ConstraintSolver).

**Behavior:**

1. Calls `validateStrategyInput()` — throws on invalid input
2. Runs `ConstraintSolver.solveAll(input)`
3. Verifies all `invariants.md` on output
4. Returns round table and summary

**Example:**

```typescript
import { generateStrategy } from '@/core/strategy-generator';

const result = generateStrategy({
  rewardMultiplier: 20,
  minimumBet: 10000,
  betStep: 1000,
  numberOfRounds: 5,
  profitMode: 'break-even',
  targetProfit: 0,
});

console.log(result.summary.totalBankrollRequired);
console.log(result.rounds[0].bet);
```

**Throws:**

| Error                     | Condition                            |
| ------------------------- | ------------------------------------ |
| `StrategyValidationError` | Invalid input (see ValidationEngine) |

---

## Module: `@/core/validation`

#### `validateStrategyInput(input: StrategyInput): void`

Validates input without performing calculation.

**Throws:** `StrategyValidationError` with descriptive message if invalid.

**Validation rules:**

| Field              | Rule                                       |
| ------------------ | ------------------------------------------ |
| `rewardMultiplier` | Must be finite, **> 1**                    |
| `minimumBet`       | Must be finite, > 0, multiple of `betStep` |
| `betStep`          | Must be finite, > 0                        |
| `numberOfRounds`   | Must be integer, ≥ 1                       |
| `profitMode`       | Must be valid enum value                   |
| `targetProfit`     | Must be finite, ≥ 0                        |

---

### Errors

#### `StrategyValidationError`

```typescript
class StrategyValidationError extends Error {
  readonly field: keyof StrategyInput | 'unknown';
  constructor(field: keyof StrategyInput | 'unknown', message: string);
}
```

---

## Module: `@/core/rounding` (Utilities)

#### `ceilToStep(value: number, step: number): number`

Rounds `value` UP to the nearest multiple of `step`.

```typescript
ceilToStep(10500, 1000); // 11000
ceilToStep(10000, 1000); // 10000
```

**Preconditions:** `step > 0`

---

#### `applyMinimumBet(bet: number, minimumBet: number): number`

Returns `max(bet, minimumBet)`.

---

## Module: `@/core/profit` (Utilities)

#### `computeDesiredProfit(mode: ProfitMode, totalSpent: number, targetProfit: number): number`

Computes desired profit for the current round based on profit mode.

| Mode                  | Returns                             |
| --------------------- | ----------------------------------- |
| `'break-even'`        | `0`                                 |
| `'fixed-profit'`      | `targetProfit`                      |
| `'percentage-profit'` | `totalSpent * (targetProfit / 100)` |

---

## Future API (Not Yet Implemented)

The following are planned for later phases. **Do not implement until current-task.md specifies them.**

| Function                | Phase | Description                                      |
| ----------------------- | ----- | ------------------------------------------------ |
| `findMinimumBankroll()` | 5     | Binary search for min bankroll given constraints |
| `simulateWinAtRound()`  | 3     | Return bankroll path with win at round N         |
| `exportToCsv()`         | 4     | Serialize StrategyResult to CSV string           |

---

## Versioning

Public API follows semantic versioning once published.

Breaking changes to `StrategyInput`, `StrategyResult`, or `generateStrategy` signature require:

1. ADR entry in DECISIONS.md
2. Migration notes in this document
3. Updated unit tests

---

## References

- `.memory-bank/algorithms.md` — Authoritative algorithm
- `.memory-bank/business-rules.md` — Authoritative business rules
- `docs/PRD.md` — Product requirements
