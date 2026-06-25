# Public API — Surface Inventory (Sprint 2.7A)

**Status:** ACCEPTED — Sprint 2.7A sign-off  
**Authority:** ADR-037, `docs/design/public-api-spec.md`

This document classifies every symbol currently reachable from internal barrels.  
**Only symbols marked PUBLIC appear in `src/public/index.ts`.**

Legend:

| Class           | Meaning                                                         |
| --------------- | --------------------------------------------------------------- |
| **PUBLIC**      | Exported from `public/index.ts` — SemVer contract               |
| **TYPE-ONLY**   | Exported as `export type` — consumers annotate, never construct |
| **INTERNAL**    | Not in public API — refactor allowed                            |
| **APPLICATION** | Application layer — not Core SDK v1 (future package split)      |

---

## 1. Capabilities (functions)

| Symbol                       | Source                      | Class      | Rationale                 |
| ---------------------------- | --------------------------- | ---------- | ------------------------- |
| `validateCalculationRequest` | `@/core/validation`         | **PUBLIC** | Entry: input trust        |
| `solve`                      | `@/core/solver`             | **PUBLIC** | Entry: optimal plan       |
| `buildStrategy`              | `@/core/strategy-builder`   | **PUBLIC** | Entry: aggregate          |
| `buildStatistics`            | `@/core/statistics-builder` | **PUBLIC** | Entry: derived snapshot   |
| `simulateWinAtRound`         | `@/core/simulation`         | **PUBLIC** | Entry: scenario interpret |

### Explicitly INTERNAL (never public)

| Symbol                                                  | Source                               | Rationale                                     |
| ------------------------------------------------------- | ------------------------------------ | --------------------------------------------- |
| `ceilDiv`, `ceilToStep`, `floorDiv`                     | `solver/integer-math`                | Algorithm implementation                      |
| `resolveTarget`                                         | `solver/resolve-target`              | Solver internal                               |
| `solveMinimalFeasibleBet`                               | `solver/solve-minimal-feasible-bet`  | Solver internal                               |
| `runPhase`                                              | `validation/run-phase`               | Pipeline internal                             |
| `buildValidationResult`                                 | `validation/build-validation-result` | Pipeline internal                             |
| `structuralRules`, `businessRules`, `mathematicalRules` | `validation/rules/*`                 | Rule registry — internal                      |
| `success`, `failure`                                    | `@/core/contracts/result`            | Constructors — consumers use `kind` narrowing |

---

## 2. Input DTOs

| Symbol                        | Source              | Class         | Rationale                                                |
| ----------------------------- | ------------------- | ------------- | -------------------------------------------------------- |
| `CalculationRequest`          | `@/application/dto` | **PUBLIC**    | Primary input                                            |
| `ValidatedCalculationRequest` | `@/application/dto` | **TYPE-ONLY** | Success type from validate                               |
| `TargetProfit`                | `@/application/dto` | **TYPE-ONLY** | Part of request shape                                    |
| `RewardMultiplier`            | `@/application/dto` | **TYPE-ONLY** | Request field alias                                      |
| `RoundCount`                  | `@/application/dto` | **TYPE-ONLY** | Request field alias                                      |
| `MinimumBet`                  | `@/application/dto` | **TYPE-ONLY** | Request field alias                                      |
| `BetStep`                     | `@/application/dto` | **TYPE-ONLY** | Request field alias                                      |
| `ProfitMode`                  | `@/application/dto` | **INTERNAL**  | Legacy — not on `CalculationRequest`; omit unless needed |

---

## 3. Domain models (outputs)

| Symbol                                                        | Source          | Class         | Rationale                                                           |
| ------------------------------------------------------------- | --------------- | ------------- | ------------------------------------------------------------------- |
| `Strategy`                                                    | `@/core/models` | **PUBLIC**    | Core aggregate                                                      |
| `Round`                                                       | `@/core/models` | **PUBLIC**    | Strategy building block                                             |
| `StrategyStatistics`                                          | `@/core/models` | **PUBLIC**    | Statistics output                                                   |
| `SimulationResult`                                            | `@/core/models` | **PUBLIC**    | Simulation output                                                   |
| `RoundSimulation`                                             | `@/core/models` | **TYPE-ONLY** | Part of `SimulationResult.rounds` — consumers read, don't construct |
| `RoundResult`                                                 | `@/core/models` | **TYPE-ONLY** | `'Win' \| 'Lose' \| 'NotPlayed'` — part of trace                    |
| `BetAmount`, `RewardAmount`, `ProfitAmount`, `BankrollAmount` | `@/core/models` | **TYPE-ONLY** | Amount semantics on public models                                   |
| `Amount`                                                      | `@/core/models` | **INTERNAL**  | Base alias — export specific amount types only                      |

---

## 4. Result & error types

| Symbol               | Source              | Class         | Rationale                              |
| -------------------- | ------------------- | ------------- | -------------------------------------- |
| `Result`             | `@/core/contracts`  | **PUBLIC**    | Universal result pattern               |
| `Success`, `Failure` | `@/core/contracts`  | **TYPE-ONLY** | Narrowing helpers                      |
| `ValidationResult`   | `@/core/contracts`  | **PUBLIC**    | Validate failure payload               |
| `ValidationError`    | `@/core/contracts`  | **PUBLIC**    | UI renders errors — stable shape       |
| `ValidationLayer`    | `@/core/contracts`  | **TYPE-ONLY** | On `ValidationError.layer`             |
| `ValidationCodes`    | `@/core/validation` | **PUBLIC**    | Immutable error codes (ADR-026)        |
| `SimulationError`    | `@/core/simulation` | **PUBLIC**    | Scenario parameter errors              |
| `SolverError`        | `@/core/solver`     | **TYPE-ONLY** | `never` — documents `solve()` contract |

### APPLICATION (not Core SDK v1 public)

| Symbol             | Source             | Class           | Rationale                               |
| ------------------ | ------------------ | --------------- | --------------------------------------- |
| `StrategyResult`   | `@/core/contracts` | **APPLICATION** | Orchestration — Sprint 5+ / app package |
| `StrategyMetadata` | `@/core/contracts` | **APPLICATION** | Pipeline metadata — not engine          |

---

## 5. Approved public surface (summary)

### Functions (5)

```text
validateCalculationRequest
solve
buildStrategy
buildStatistics
simulateWinAtRound
```

### Values (1)

```text
ValidationCodes
```

### Types — runtime + annotation

```text
CalculationRequest
Strategy
Round
StrategyStatistics
SimulationResult
ValidationResult
ValidationError
Result
ValidationCodes (const object)
SimulationError
```

### Types — type-only exports

```text
ValidatedCalculationRequest
TargetProfit
RewardMultiplier
RoundCount
MinimumBet
BetStep
BetAmount
RewardAmount
ProfitAmount
BankrollAmount
RoundSimulation
RoundResult
Success
Failure
ValidationLayer
SolverError
```

**Total: 5 functions + 1 const + ~20 types** (exact list frozen in compat snapshot test).

---

## 6. Rejected for public API

| Category                  | Examples                   | Why                            |
| ------------------------- | -------------------------- | ------------------------------ |
| Solver internals          | `ceilDiv`, `resolveTarget` | Implementation                 |
| Validation internals      | `runPhase`, `*Rules`       | Pipeline                       |
| Result constructors       | `success`, `failure`       | Internal wiring                |
| Application orchestration | `StrategyResult`           | Wrong layer for engine package |
| Base alias                | `Amount`                   | Export specific amount types   |

---

## 7. Consumer pipeline (documented, not exported as single function)

```text
validateCalculationRequest(request)
  → solve(validated)
  → buildStrategy(solved.value.rounds)
  → buildStatistics(strategy)
  → simulateWinAtRound(strategy, winAtRound)  // optional
```

Application layer may add `generateStrategy()` later — **not** Core SDK v1 public.

---

## References

- `docs/design/public-api-spec.md`
- `docs/COMPATIBILITY-POLICY.md`
- ADR-026 (ValidationCodes), ADR-037
