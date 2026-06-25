# Architecture Tests

**Rev. 2** — Layer model: pages → features → application → core

---

## Rule A1 — Core Never Imports React

`src/core/**` → MUST NOT import react, @mui/\*, lucide-react

---

## Rule A2 — Core Never Imports Upper Layers

`src/core/**` → MUST NOT import application, features, pages, components, hooks

---

## Rule A3 — Application Never Imports UI

`src/application/**` → MUST NOT import pages, features, components, hooks, React

---

## Rule A4 — Features Never Import Core

`src/features/**` → MUST NOT import `@/core/**`  
**Must use** `@/application/**`

---

## Rule A5 — Pages Never Import Core or Application

`src/pages/**` → MUST NOT import `@/core/**` or `@/application/**`  
**Must use** `@/features/**`

---

## Rule A6 — Components Never Import Core

`src/components/**` → MUST NOT import `@/core/**`

---

## Rule A7 — Hooks Never Import Core Directly

`src/hooks/**` → MUST NOT import `@/core/**`  
May import `@/application/**` or `@/features/**`

---

## Rule A8 — Solver Isolation

`src/core/solver/**` → MAY import algorithms, utils, models  
MUST NOT import strategy-builder, simulation, optimization, application

---

## Rule A9 — StrategyBuilder

`src/core/strategy-builder/**` → MAY import models only  
MUST NOT import solver, validation, statistics-builder, simulation, optimization  
MUST be the **canonical constructor** for `Strategy` from `Round[]` (ADR-034)  
MUST NOT derive information (including `rounds.length`)

---

## Rule A10 — StatisticsBuilder

`src/core/statistics-builder/**` → MAY import models only  
MUST NOT import solver, validation, strategy-builder, simulation, optimization  
MUST be **canonical constructor** for `StrategyStatistics` (ADR-035)  
MUST be observational — never mutate `Strategy`

---

## Rule A11 — Optimization Independence

`src/core/optimization/**` → MAY import solver, strategy-builder, models  
MUST NOT import simulation

---

## Rule A12 — SimulationEngine

`src/core/simulation/**` → MAY import models only  
MUST NOT import solver, validation, strategy-builder, statistics-builder, optimization  
MUST be canonical constructor for `SimulationResult` (ADR-036)  
MUST NOT read `StrategyStatistics` — deterministic scenario interpreter only

---

## Rule A13 — Optimization Independence

`src/core/simulation/**` → MAY import models (Strategy)  
MUST NOT import optimization  
MUST NOT be imported by optimization

---

## Rule A12 — No throw in Core Public API

Core exported functions return `Result<T,E>` — verified by code review + tests

---

## Rule A13 — Domain Models

Engine modules use `src/core/models/` types — no ad-hoc literal types in solver

---

## Rule A14 — No Circular Dependencies

Any cycle = Critical defect

---

## Rule A15 — Fixtures

Regression tests must load from `tests/fixtures/` when fixture exists

---

## Future: dependency-cruiser (Sprint 4)

```bash
pnpm run arch:test
```

---

See `import-rules.test.ts` for folder smoke tests.
