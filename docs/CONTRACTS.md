# Module Contracts

**Status:** FROZEN — Sprint 2.2 (rev. 3.6)  
**Purpose:** Binding agreements between modules.

See: `docs/DOMAIN-LANGUAGE.md` v1.2.0, `docs/FLOWS.md`, `docs/API.md`, `src/core/models/`, `src/core/contracts/`, `src/application/dto/`.

---

## Contract Chain

```text
CalculationRequest (DTO — @/application/dto)
     ↓
Result<ValidatedCalculationRequest, ValidationResult>  ← ValidationEngine
     ↓
Strategy                             ← ConstraintSolver (bet sequence only)
     ↓
Strategy (normalized)                ← StrategyBuilder
     ↓
StrategyStatistics                   ← StatisticsBuilder
     ↓
StrategyResult                       ← Application orchestration
     ↓
Result<OptimizationResult, E>        ← OptimizationEngine (uses Solver)
     ↓
Simulation                           ← SimulationEngine (evaluates Strategy)
     ↓
ReportOutput                         ← ReportGenerator
```

**Application layer** (`@/application/strategy/*`) orchestrates the chain for consumers.

---

## Contract 0: Result Type (all core public APIs)

**Path:** `@/core/contracts/result.ts`

```typescript
type Success<T> = { readonly kind: 'success'; readonly value: T };
type Failure<E> = { readonly kind: 'failure'; readonly error: E };
type Result<T, E> = Success<T> | Failure<E>;

function success<T>(value: T): Success<T>;
function failure<E>(error: E): Failure<E>;

// Narrow with: if (result.kind === 'success') { ... }
// Do NOT export isSuccess / isFailure helpers.

// Core MUST NOT throw. Application may map Result → UI errors.
```

---

## Contract 0b: Value Objects

**Path:** `@/core/models/amounts.ts`

```typescript
type Amount = number;
type BetAmount = Amount;
type RewardAmount = Amount;
type ProfitAmount = Amount;
type BankrollAmount = Amount;
```

---

## Contract 1: CalculationRequest (DTO — NOT domain model)

**Path:** `@/application/dto/calculation-request.ts` (Sprint 2.1B)  
**Flow:** `docs/FLOWS.md` — CalculationRequest

DTOs live in `application/dto/` today; may move to `application/contracts/` when API layer exists.  
**No validation in DTO** — ValidationEngine owns rules (Sprint 2.2).

```typescript
type RewardMultiplier = number;
type BetStep = Amount;
type MinimumBet = BetAmount;
type RoundCount = number;

type ProfitMode = 'breakEven' | 'fixedAmount' | 'percentage';

type TargetProfit =
  | { readonly mode: 'breakEven' }
  | { readonly mode: 'fixedAmount'; readonly amount: ProfitAmount }
  | { readonly mode: 'percentage'; readonly percentage: number };

interface CalculationRequest {
  readonly rewardMultiplier: RewardMultiplier;
  readonly roundCount: RoundCount;
  readonly minimumBet: MinimumBet;
  readonly betStep: BetStep;
  readonly targetProfit: TargetProfit;
}
```

> **Deprecated:** `StrategyInput`, `StrategyOptions`, `numberOfRounds`, flat `targetProfit: number`, kebab-case profit modes.

Future request DTOs (Sprint 3+): `OptimizationRequest`, `SimulationRequest` — see `docs/FLOWS.md`.

Math: `docs/MATHEMATICAL-SPECIFICATION.md` v2.0.0 — **approved**.

---

## Contract 2: ValidationEngine — **FROZEN** (ADR-026)

**Path:** `@/core/validation`  
**Taxonomy:** `docs/MATHEMATICAL-SPECIFICATION.md` §12  
**Stability:** Stable API — breaking changes require major version bump

```typescript
function validateCalculationRequest(
  request: CalculationRequest,
): Result<ValidatedCalculationRequest, ValidationResult>;

type ValidatedCalculationRequest = CalculationRequest; // @/application/dto

interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly path: string;
  readonly layer: 'structural' | 'business' | 'mathematical';
}

interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationError[];
  readonly errorCount: number;
  readonly warningCount: number;
}
```

**Principles (frozen — ADR-026):**

- **No mutation** — never coerce, round, or default input fields.
- **Three phases** — structural → business → mathematical; stop at first failing phase.
- **Pure function** — deterministic, no I/O, no `Date`, no `Math.random`, no env reads.
- **Isolation** — must not import solver, strategy-builder, simulation, or optimization.
- **Rules registry** — `structuralRules`, `businessRules`, `mathematicalRules` arrays; engine iterates only; **no class-based engine**.
- **Domain contract only** — `ValidationResult` has no UI fields; application/UI layer maps for display and localization.
- **Error codes immutable after release** — `S###`, `B###`, `M###`; messages may change, codes must not.
- **Developer messages** — `ValidationError.message` is for developers/logs; user-facing copy maps from `code`.
- **No validation statistics** — no `executionTime`, `rulesExecuted`, etc.

**Path:** `@/core/contracts/validation-result.ts`

---

## Contract 3: ConstraintSolver (Sprint 2.3)

**Path:** `@/core/solver`  
**Math:** `docs/MATHEMATICAL-SPECIFICATION.md`  
**Design:** `docs/design/constraint-solver-algorithm.md` (algorithm paper — design gate)  
**Flow:** `docs/FLOWS.md`

```typescript
function solve(validated: ValidatedCalculationRequest): Result<Strategy, SolverError>;
```

Single algorithm — **pure function**. No UI, DTO transport, ValidationEngine, or Optimization imports.

**Responsibility:** Calculate bet sequence → **`Strategy` only**.

**Must not return:** `StrategyResult`, `StrategyStatistics`, `ValidationResult`, metadata.

**Trust boundary (ADR-027):**

- Input is **`ValidatedCalculationRequest`** — solver **must not re-validate** fields.
- **Pure function over immutable input** — no mutation, no side effects (algorithm paper §10).
- Solver computes mathematics only (greedy O(N) state machine).

**Must not import:** StrategyBuilder, StatisticsBuilder, Simulation, Optimization.

Math: `docs/MATHEMATICAL-SPECIFICATION.md` §5–§11.  
Design: `docs/design/constraint-solver-algorithm.md`.  
Design: `docs/design/constraint-solver-implementation-checklist.md` (2.3E gate).

---

## Contract 3b: StrategyAlgorithm (plugin — Sprint 4 only)

**Deferred** until ConstraintSolver is proven. Do not implement in Sprint 2.x.

Preview interface (subject to change after solver experience):

```typescript
interface StrategyAlgorithm {
  readonly id: string;
  execute(request: CalculationRequest): Result<Strategy, SolverError>;
}
```

Registry + Factory: Sprint 4 — Plugin Architecture.

---

## Contract 5: Domain Models

**Path:** `@/core/models`

### Round (raw input only — forbidden forever: profitAmount, roi)

```typescript
interface Round {
  readonly index: number;
  readonly betAmount: BetAmount;
  readonly rewardAmount: RewardAmount;
  /** AccumulatedSpentAfterRound (Aᵢ) — inclusive through this round. Not "before". */
  readonly accumulatedSpent: BankrollAmount;
}
```

### Strategy (plan only — no statistics)

```typescript
interface Strategy {
  readonly rounds: readonly Round[];
}
```

### StrategyStatistics

```typescript
interface StrategyStatistics {
  readonly roundCount: number;
  readonly requiredBankrollAmount: BankrollAmount;
  readonly maximumBetAmount: BetAmount;
  readonly averageBetAmount: BetAmount;
  readonly minimumBetAmount: BetAmount;
  readonly expectedProfitAmount: ProfitAmount;
}
```

---

## Contract 5b: Pipeline Contracts

**Path:** `@/core/contracts`

### StrategyResult (field order = workflow)

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

Workflow: Generate → Validate → Solve → Build → Statistics → Metadata.

---

## Contract 6: StrategyBuilder (Sprint 2.4)

**Path:** `@/core/strategy-builder`

**Responsibility:** **Canonical constructor** for domain `Strategy` from raw `Round[]`. **No statistics. No derived values.**

```typescript
function buildStrategy(rounds: readonly Round[]): Strategy;
```

| Rule                  | Detail                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical constructor | Only `buildStrategy()` may assemble `Strategy` from round data (ADR-034). Exception: frozen `ConstraintSolver` algorithm output — application must call `buildStrategy(solve(...).value.rounds)`. |
| Ownership             | `Round[]` ownership transfers to `Strategy`; caller must not mutate after call.                                                                                                                   |
| Builder contract      | `buildStrategy([])` is valid. Pipeline contract: validated path never produces empty rounds.                                                                                                      |
| Forbidden             | `roundCount`, `requiredBankroll`, `averageBet`, any derived field — even `rounds.length`                                                                                                          |

Does **not** compute `StrategyStatistics`. Does **not** validate input.

**Must not import:** ConstraintSolver, ValidationEngine, StatisticsBuilder, Simulation, Optimization.

---

## Contract 6b: StatisticsBuilder (Sprint 2.5)

**Path:** `@/core/statistics-builder`

**Responsibility:** **Canonical derived data calculator** — observational, never transformational. Computes `StrategyStatistics` from `Strategy` only.

```typescript
function buildStatistics(strategy: Strategy): StrategyStatistics;
```

| Field                                   | Formula                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| `roundCount`                            | `rounds.length`                                                                   |
| `requiredBankrollAmount`                | `last.accumulatedSpent` (or `0` if empty)                                         |
| `maximumBetAmount` / `minimumBetAmount` | max / min of `betAmount`                                                          |
| `averageBetAmount`                      | `floor(Σ betAmount / N)`                                                          |
| `expectedProfitAmount`                  | `last.rewardAmount − last.accumulatedSpent` — **terminal profit, not cumulative** |

Does **not** read `CalculationRequest`. Does **not** mutate `Strategy`. Does **not** prove invariants.

**Must not import:** ConstraintSolver, ValidationEngine, StrategyBuilder, Simulation, Optimization.

**Future:** SimulationEngine uses `Strategy` only — not `StrategyStatistics` (ADR-035).

---

## Contract 7: Application — generateStrategy

**Path:** `@/application/strategy/generateStrategy.ts`

```typescript
function generateStrategy(request: CalculationRequest): Result<StrategyResult, ApplicationError>;
```

Orchestrates: validate → solve → buildStrategy → buildStatistics → assemble `StrategyResult`.

---

## Contract 8: OptimizationEngine

**Path:** `@/core/optimization`

**Depends on:** `ConstraintSolver`, `StrategyBuilder` — **NOT** SimulationEngine.

```typescript
function optimize(input: OptimizationInput): Result<OptimizationResult, OptimizationError>;

interface OptimizationInput {
  readonly request: OptimizationRequest;
  readonly goal: OptimizationGoal;
  readonly maxRounds?: number;
}

/** Sprint 3 — separate from CalculationRequest. Not implemented yet. */
interface OptimizationRequest {
  readonly baseCalculation: Omit<CalculationRequest, 'roundCount'>;
  readonly maximumBetAmount?: BetAmount;
  readonly maximumBankrollAmount?: BankrollAmount;
}

interface OptimizationGoal {
  readonly type: 'min-bankroll' | 'min-max-bet' | 'max-profit' | 'balanced';
  readonly target?: number;
}

interface OptimizationResult {
  readonly optimalRounds: number;
  readonly strategyResult: StrategyResult;
  readonly metricValue: number;
}
```

---

## Contract 9: SimulationEngine (Sprint 2.6)

**Path:** `@/core/simulation`

**Role:** Deterministic **scenario interpreter** — evaluates "win at round W" for a built `Strategy`.

> SimulationEngine interprets deterministic scenarios. Not Monte Carlo. Not random.

```typescript
function simulateWinAtRound(
  strategy: Strategy,
  winAtRound: number,
): Result<SimulationResult, SimulationError>;

interface SimulationResult {
  readonly winningRoundIndex: number;
  readonly profitAmount: ProfitAmount; // terminal scenario profit
  readonly requiredBankrollAmount: BankrollAmount;
  readonly rounds: readonly RoundSimulation[];
}

interface RoundSimulation {
  readonly index: number;
  readonly result: RoundResult;
  readonly betAmount: BetAmount;
  readonly accumulatedSpent: BankrollAmount;
}

type RoundResult = 'Win' | 'Lose' | 'NotPlayed';

type SimulationError = 'EMPTY_STRATEGY' | 'WIN_ROUND_NOT_INTEGER' | 'WIN_ROUND_OUT_OF_RANGE';
```

**Invariant:** exactly one `Win` per result — `Lose*` → `Win` → `NotPlayed*`.

**Must not:** mutate `Strategy`, read `StrategyStatistics`, use randomness, cache results.

**Must not import:** ConstraintSolver, ValidationEngine, StrategyBuilder, StatisticsBuilder, Optimization.

**OptimizationEngine must not import SimulationEngine.**

---

## Contract 10: ReportGenerator

**Path:** `@/core/report`

```typescript
function toCsv(strategyResult: StrategyResult): Result<string, ReportError>;
function toJson(strategyResult: StrategyResult): Result<string, ReportError>;
```

---

## Breaking Change Policy

ADR + update this file + `CHANGELOG.md` + user approval.

**Contract version:** 3.4.0

**Changes in v3.4.0:**

- Math spec v2.0.0 approved — `ValidatedCalculationRequest`, validation `layer` field
- ConstraintSolver input: `ValidatedCalculationRequest` only (pure function)

**Breaking changes in v3.3.0:**

- Roadmap pivot: plugin architecture deferred to **Sprint 4**
- Sprint 2.1C = `docs/MATHEMATICAL-SPECIFICATION.md` (not StrategyAlgorithm)
- Removed `StrategyOptions` — replaced by `OptimizationRequest` (Sprint 3 preview)
- ConstraintSolver returns `Strategy` directly per math spec; plugins deferred

**Breaking changes in v3.2.0:**

- `StrategyInput` renamed to `CalculationRequest`
- `numberOfRounds` → `roundCount`; flat `targetProfit` → `TargetProfit` discriminated union
- `ProfitMode` literals: `breakEven` | `fixedAmount` | `percentage` (camelCase, no enum)
- Request type aliases: `RewardMultiplier`, `BetStep`, `MinimumBet`, `RoundCount`
- `StrategyOptions` for soft constraints (separate from CalculationRequest)
- `StrategyAlgorithm` deferred to Sprint 2.1C (contract preview only)
- All new contracts require flow in `docs/FLOWS.md`

**Breaking changes in v3.1.0:**

- `Result`, `ValidationResult`, `StrategyResult` moved to `@/core/contracts/`
- Removed `isSuccess()` / `isFailure()` — use `result.kind` discriminant
- `StrategyStatistics.roundCount` added
- `StrategyMetadata` locked: `generatedAt`, `algorithm`, `version`
- `StrategyResult` field order: strategy → validation → statistics → metadata
- `StrategyInput` DTO path: `@/application/dto/` (not `core/models`)

**Breaking changes in v3.0.0:**

- `Result` shape: `Success` / `Failure` replaces `{ ok, value, error }`
- Field renames: `betAmount`, `rewardAmount`, `accumulatedSpent`, `requiredBankrollAmount`
- `Round` no longer contains `profitAmount` or `roi`
- `StrategySummary` replaced by `StrategyStatistics`
- `generateStrategy` returns `StrategyResult`
