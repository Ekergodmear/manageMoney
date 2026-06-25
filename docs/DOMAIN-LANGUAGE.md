# Domain Language — Ubiquitous Language

**Status:** FROZEN — Sprint 2.1A (rev. 1.3.0 — precision amendment)  
**Version:** 1.3.0  
**Purpose:** Single source of truth for all domain terminology in Stake Planner.

When terms conflict with any other document — including `.memory-bank/glossary.md`, `.memory-bank/domain.md`, or casual usage — **this file wins**.

All of the following MUST use vocabulary defined here:

- Model names and type names (`src/core/models/`, `src/core/contracts/`)
- Function and method names
- Public API and DTO fields
- Test descriptions and fixture labels
- User-facing documentation

Implementation contracts: `docs/CONTRACTS.md` v3.1.0.

DTOs (not domain): `src/application/dto/` — e.g. `CalculationRequest`.  
Future: `src/application/contracts/` when API layer exists.

Every new contract MUST include a flow diagram in `docs/FLOWS.md`.

---

## Code Layout — Models vs Contracts

| Path                   | Contains                                                                       |
| ---------------------- | ------------------------------------------------------------------------------ |
| `src/core/models/`     | Domain models: `Round`, `Strategy`, `StrategyStatistics`, amount value objects |
| `src/core/contracts/`  | Cross-module contracts: `Result`, `ValidationResult`, `StrategyResult`         |
| `src/application/dto/` | Input DTOs — **not** domain models                                             |

---

## Barrel Exports

Barrel `index.ts` allowed **only at module boundaries**:

- `@/core/models/index.ts` ✅
- `@/core/contracts/index.ts` ✅
- `@/application/dto/index.ts` ✅ (when DTOs exist)

**Forbidden:** project-root `src/index.ts` or re-exporting entire `core/` from one file.

Prevents circular dependencies as the project grows.

## Naming Principle — Never "Money"

Do **not** use the word `Money` in any model, type, field, or public API name.

Use amount-based names instead:

| Use                      | Not                   |
| ------------------------ | --------------------- |
| `Amount`                 | `Money`               |
| `betAmount`              | `bet`, `amount`       |
| `rewardAmount`           | `reward`              |
| `profitAmount`           | `profit`              |
| `requiredBankrollAmount` | `bankroll`, `capital` |
| `accumulatedSpent`       | `spent`, `totalSpent` |

**Rationale:** Amount-based naming remains valid if monetary values move from `number` to `bigint`, `Decimal`, or a dedicated class later.

Display-only ratios (e.g. ROI) may use floating point. All amount fields are **positive integers** unless explicitly noted.

---

## Value Objects

Do **not** use bare `number` on domain models. Use typed aliases from `@/core/models`:

```typescript
type Amount = number;
type BetAmount = Amount;
type RewardAmount = Amount;
type ProfitAmount = Amount;
type BankrollAmount = Amount;
```

Currently plain `number` aliases (Sprint 2.1A).

**Future (major version):** branded types for compile-time safety:

```typescript
type Brand<K, T> = K & { readonly __brand: T };
type BetAmount = Brand<number, 'BetAmount'>;
```

See `KNOWN_LIMITATIONS.md`.

## Core Concepts

### Bet

The stake placed in a **single round** — represented as `BetAmount`.

| Property   | Rule                                   |
| ---------- | -------------------------------------- |
| Value      | Always a **positive integer**          |
| Minimum    | `betAmount >= minimumBet`              |
| Step       | `betAmount` is a multiple of `betStep` |
| Mutability | **Immutable** once assigned to a round |

---

### Reward

The **total amount returned** after a **successful round** — `rewardAmount`.

```
rewardAmount = betAmount × rewardMultiplier
```

**Includes the original stake.** Not profit. Not bankroll.

---

### Profit

Net gain **if the round is won** — `profitAmount`.

```
profitAmount = rewardAmount − accumulatedSpent
```

**Not** `rewardAmount − betAmount`.

Profit is a **derived value**. It does **not** belong on `Round`. It belongs on `StrategyStatistics` and simulation output.

---

### AccumulatedSpent

**Semantics (locked — Sprint 2.3B):**

| Symbol | Name                            | Meaning                                                             |
| ------ | ------------------------------- | ------------------------------------------------------------------- |
| `Aᵢ₋₁` | **AccumulatedSpentBeforeRound** | Sum of bets **before** round `i` (`A₀ = 0`) — solver state variable |
| `Aᵢ`   | **AccumulatedSpentAfterRound**  | Sum of bets **through** round `i` inclusive                         |

Field on `Round`: **`accumulatedSpent`** = **`AccumulatedSpentAfterRound`** (`Aᵢ`).

```text
Round[i].accumulatedSpent = betAmount₁ + … + betAmountᵢ
                          = AccumulatedSpentBeforeRound(i) + Round[i].betAmount
```

Solver loop reads `AccumulatedSpentBeforeRound`; when emitting a `Round`, persists **`accumulatedSpent` after** placing the bet.

Type: `BankrollAmount`. Strictly increasing when each bet is positive (Invariant I4).

> **Not stored on Round:** `AccumulatedSpentBeforeRound` — reconstruct as  
> `rounds[i-1].accumulatedSpent` (or `0` for round 1).

---

### RequiredBankroll

Minimum bankroll to execute a strategy — `requiredBankrollAmount`.

```
requiredBankrollAmount = sum of all betAmount values in the plan
```

> **Deprecated:** `Capital`, `bankroll`, `totalBankrollRequired`

---

### Round

One betting attempt. **Input data only** — no derived fields.

| Field              | Type             | Notes                                                        |
| ------------------ | ---------------- | ------------------------------------------------------------ |
| `index`            | `number`         | Starts at 1, sequential                                      |
| `betAmount`        | `BetAmount`      | Stake for this round                                         |
| `rewardAmount`     | `RewardAmount`   | Payout if this round wins                                    |
| `accumulatedSpent` | `BankrollAmount` | **After round** — cumulative stake through this round (`Aᵢ`) |

**Does NOT contain (forever):** `profitAmount`, `roi` — immutable, minimal raw data only.

**Profit if win at this round** (derived, not stored):

```text
profitAmount = rewardAmount − accumulatedSpent
             = rewardAmount − (AccumulatedSpentBeforeRound + betAmount)
```

---

### RoundResult

| Value       | Meaning         |
| ----------- | --------------- |
| `Win`       | Round succeeded |
| `Lose`      | Round failed    |
| `NotPlayed` | Not reached     |

---

### TargetProfit

Profit goal if the user **wins at the current round**. Resolved per round by ConstraintSolver as `P*`.

| `mode`        | `P*` at round `i`                                                    |
| ------------- | -------------------------------------------------------------------- |
| `breakEven`   | `0`                                                                  |
| `fixedAmount` | `targetProfit.amount` (constant every round)                         |
| `percentage`  | `floor(AccumulatedSpentBeforeRound × targetProfit.percentage / 100)` |

**Percentage mode (locked — Sprint 2.3B):**

> Percentage mode defines target profit as a **percentage of `AccumulatedSpentBeforeRound`** —  
> the sum of bets placed **before** the current round, **not** final RequiredBankroll, **not** current bet amount.

Integer division rounds **down** (conservative target). See `docs/MATHEMATICAL-SPECIFICATION.md` §4.

**Path independence (A7):** `P*` depends on spent-before-round and mode parameters only — not on win/loss outcomes of prior rounds.

DTO field: `CalculationRequest.targetProfit` — `@/application/dto/target-profit.ts`.

---

### Strategy

Deterministic betting plan — **rounds only** at model level.

```typescript
interface Strategy {
  readonly rounds: readonly Round[];
}
```

Statistics and pipeline metadata live on `StrategyResult`, not duplicated on `Strategy`.

---

### StrategyStatistics

Pre-computed summary for UI and export. UI reads this object — **does not recompute**.

| Field                    | Type             |
| ------------------------ | ---------------- |
| `roundCount`             | `number`         |
| `requiredBankrollAmount` | `BankrollAmount` |
| `maximumBetAmount`       | `BetAmount`      |
| `averageBetAmount`       | `BetAmount`      |
| `minimumBetAmount`       | `BetAmount`      |
| `expectedProfitAmount`   | `ProfitAmount`   |

UI must use `roundCount` — not `strategy.rounds.length`.

---

### Simulation

Read-only evaluation of a built `Strategy`. Never mutates the strategy. Never feeds Optimization.

---

## Constraints

### Hard Constraint

Must be satisfied. Violation → invalid input or strategy.

Examples: `minimumBet`, `betStep`, `rewardMultiplier`, `numberOfRounds`, `profitMode`, `targetProfit`

### Soft Constraint

Optimization preference. Examples: preferred profit, maximum bet, maximum bankroll, balanced strategy.

---

## Results and Goals

### Result\<T, E\>

Core error-handling. All public core functions return `Result` — never throw.

```typescript
type Success<T> = { readonly kind: 'success'; readonly value: T };
type Failure<E> = { readonly kind: 'failure'; readonly error: E };
type Result<T, E> = Success<T> | Failure<E>;
```

Use `success()` and `failure()` constructors. Narrow with discriminated union:

```typescript
if (result.kind === 'success') {
  result.value; // inferred
}
```

Do **not** export `isSuccess()` / `isFailure()` helpers.

> **Deprecated:** `{ ok, value, error }` shape

---

### ValidationResult

Rich validation output for UI rendering.

```typescript
interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
}
```

`isValid === true` only when `errors` is empty. Warnings are non-blocking.

ValidationEngine API may still return `Result<void, ValidationError>` internally; application layer maps to `ValidationResult`.

---

### StrategyResult

Full pipeline output. Field order reflects workflow:

```typescript
interface StrategyMetadata {
  readonly generatedAt: Date;
  readonly algorithm: string;
  readonly version: string;
}

interface StrategyResult {
  readonly strategy: Strategy;
  readonly validation: ValidationResult;
  readonly statistics: StrategyStatistics;
  readonly metadata: StrategyMetadata;
}
```

Workflow: **Generate → Validate → Compute Statistics → Metadata**

### OptimizationGoal

| Domain name         | Contract ID    |
| ------------------- | -------------- |
| Minimum Bankroll    | `min-bankroll` |
| Maximum Profit      | `max-profit`   |
| Minimum Maximum Bet | `min-max-bet`  |
| Balanced Strategy   | `balanced`     |

---

## Module Vocabulary

```text
CalculationRequest (DTO — application/dto)
  → ValidationResult
  → SolverOutput
  → Strategy
  → StrategyResult
  → Simulation (read-only)
  → OptimizationResult (via solver, not simulation)
```

---

## Terminology Migration

| Legacy                    | Use instead                                 |
| ------------------------- | ------------------------------------------- |
| `Capital`                 | `requiredBankrollAmount`                    |
| `spent`, `totalSpent`     | `accumulatedSpent`                          |
| `bet`, `reward`, `profit` | `betAmount`, `rewardAmount`, `profitAmount` |
| `bankroll`                | `requiredBankrollAmount`                    |
| `Money`                   | `*Amount`                                   |
| `{ ok, value, error }`    | `Success` / `Failure`                       |
| `profit` on `Round`       | `StrategyStatistics.expectedProfitAmount`   |

---

## Change Policy

1. User review required.
2. Bump version in this file.
3. Update `docs/CONTRACTS.md`.
4. Update `CHANGELOG.md`.
5. No silent renames in code.

**Domain language frozen after Sprint 2.1A Domain Model approval.**
