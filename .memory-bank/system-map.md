# System Map (Knowledge Graph)

**Rev. 2** — Approved with Sprint 0.5 architectural amendments.

---

## Layer Stack

```text
pages → features → application → core
```

Within **core** (bottom-up):

```text
utils
  ↑
models + algorithms (StrategyAlgorithm plugins)
  ↑
ValidationEngine
  ↑
ConstraintSolver        (math only)
  ↑
StrategyBuilder         (SolverOutput → Strategy)
  ↑
OptimizationEngine      (uses Solver + Builder — NOT Simulation)
  ↑
SimulationEngine        (evaluates Strategy — consumer)
  ↑
ReportGenerator
```

**Application** orchestrates core for use cases:

```text
generateStrategy.ts   → validate → solve → build
optimizeStrategy.ts   → optimize
simulateStrategy.ts   → simulate
```

---

## Pages

**Path:** `src/pages/`  
**Imports:** `@/features/*` only  
**Must NOT import:** application, core

---

## Features

**Path:** `src/features/planner/`  
**Imports:** `@/application/*`, `@/components/*`, `@/hooks/*`  
**Must NOT import:** `@/core/*`

---

## Application Layer

**Path:** `src/application/`

| Module                         | Orchestrates                  | Public fn            |
| ------------------------------ | ----------------------------- | -------------------- |
| `strategy/generateStrategy.ts` | validation → solver → builder | `generateStrategy()` |
| `strategy/optimizeStrategy.ts` | optimization                  | `optimizeStrategy()` |
| `strategy/simulateStrategy.ts` | simulation                    | `simulateStrategy()` |
| `validation/`                  | re-export / compose           | —                    |

**Imports:** `@/core/*` only  
**Must NOT import:** pages, features, components, React

---

## Core: Models

**Path:** `src/core/models/`

| Model              | Purpose                     |
| ------------------ | --------------------------- |
| `Strategy`         | Full plan                   |
| `Round`            | Single round                |
| `Bet`              | Bet value object            |
| `Simulation`       | Simulation result           |
| `Constraint`       | Active constraints snapshot |
| `OptimizationGoal` | Optimization target         |

Engine operates on models — **no ad-hoc object literals** in solver/builder.

---

## Core: StrategyAlgorithm

**Path:** `src/core/algorithms/`

Plugin interface — one implementation per profit mode / future strategy type.

---

## Core: ConstraintSolver

**Path:** `src/core/solver/`  
**Uses:** algorithms, utils, models  
**Used by:** StrategyBuilder, OptimizationEngine  
**Exports:** `solve(): Result<SolverOutput, SolverError>`

---

## Core: StrategyBuilder

**Path:** `src/core/strategy-builder/`  
**Uses:** models, solver output  
**Used by:** application, OptimizationEngine  
**Exports:** `buildStrategy(): Result<Strategy, BuildError>`

---

## Core: OptimizationEngine

**Path:** `src/core/optimization/`  
**Uses:** ConstraintSolver, StrategyBuilder — **NOT SimulationEngine**  
**Used by:** application  
**Exports:** `optimize(): Result<OptimizationResult, OptimizationError>`

---

## Core: SimulationEngine

**Path:** `src/core/simulation/`  
**Uses:** Strategy model  
**Used by:** application, features (via application)  
**Exports:** `simulateWinAtRound(): Result<Simulation, SimulationError>`

**Note:** Simulation is a **consumer** of Strategy. Optimization does not depend on it.

---

## Import Matrix

| From \ To   | core          | application | features | pages |
| ----------- | ------------- | ----------- | -------- | ----- |
| core        | utils, models | ❌          | ❌       | ❌    |
| application | ✅            | —           | ❌       | ❌    |
| features    | ❌            | ✅          | —        | ❌    |
| pages       | ❌            | ❌          | ✅       | —     |

---

## Design Gates

- **Sprint 2.3:** pseudo-code → flowchart → tests → TypeScript (`algorithm-design-process.md`)
- **Sprint 3:** Mathematical proof before OptimizationEngine code

---

_Enforced by `tests/architecture/`._
