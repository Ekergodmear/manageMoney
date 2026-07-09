# Public API — Core SDK v1

**Entry:** `src/public/index.ts`  
**Import (future publish):** `@stake/constraint-engine`  
**Import (monorepo):** `@/public`

This file is the first place to look when asking: _what does this SDK actually support?_

---

## Capabilities

| Symbol                       | Stable Since | Description                         |
| ---------------------------- | ------------ | ----------------------------------- |
| `validateCalculationRequest` | 1.0.0        | Trust boundary — validate input     |
| `solve`                      | 1.0.0        | Optimal betting plan                |
| `buildStrategy`              | 1.0.0        | Canonical `Strategy` aggregate      |
| `buildStatistics`            | 1.0.0        | Observational statistics snapshot   |
| `simulateWinAtRound`         | 1.0.0        | Deterministic win-at-round scenario |

---

## Stable Constant Registry

| Symbol            | Stable Since | Description                             |
| ----------------- | ------------ | --------------------------------------- |
| `ValidationCodes` | 1.0.0        | Immutable error code registry (ADR-026) |

Constant **names** and **values** are SemVer-stable. Consumers may `switch` on `error.code` using `ValidationCodes.*`.

The public export is `Object.freeze` — do not mutate.

---

## Consumer pipeline

```typescript
const validated = validateCalculationRequest(request);
if (validated.kind === 'failure') {
  return validated.error;
}

const solved = solve(validated.value);
if (solved.kind === 'failure') {
  return solved.error;
}

const strategy = buildStrategy(solved.value.rounds);
const statistics = buildStatistics(strategy);
const simulation = simulateWinAtRound(strategy, winAtRound);
```

`solve` returns a `Strategy`; `buildStrategy` is the canonical constructor if you have `Round[]` from another source.

---

## Types (summary)

| Category         | Symbols                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Input            | `CalculationRequest`, `ValidatedCalculationRequest`, `TargetProfit`, request field aliases |
| Output           | `Strategy`, `Round`, `StrategyStatistics`, `SimulationResult`                              |
| Result pattern   | `Result`, `Success`, `Failure`                                                             |
| Validation       | `ValidationResult`, `ValidationError`, `ValidationLayer`                                   |
| Errors           | `SimulationError`, `SolverError`                                                           |
| Amounts          | `BetAmount`, `RewardAmount`, `ProfitAmount`, `BankrollAmount`                              |
| Simulation trace | `RoundSimulation`, `RoundResult` (type-only — read via `SimulationResult.rounds`)          |

`rewardMultiplier` accepts integers and values with **up to 2 decimal places** (e.g. `1.95`, `9.8`, `20`).

Full inventory: `docs/design/public-api-inventory.md`

---

## Not public

- `StrategyResult`, `StrategyMetadata` — application orchestration (future package)
- `success`, `failure` — internal `Result` constructors
- Solver / validation internals (`ceilDiv`, `runPhase`, `*Rules`, …)
- `Amount` base alias

---

## Policy

Changes to `src/public/index.ts` are **breaking review candidates** — see `docs/CORE-STABILITY.md` and `docs/COMPATIBILITY-POLICY.md`.

Capability set is **frozen** for v1 — see `API_FREEZE.md`.

**At first npm publish:** add Migration Guide (`0.x → 1.0`) alongside CHANGELOG.
