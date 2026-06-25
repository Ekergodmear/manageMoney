# Architecture

Stake Planner is a **constraint optimization engine** with a strict layered design.

---

## Layer Model

```text
pages
  ↓
features
  ↓
application      ← orchestration (generateStrategy, simulate, optimize)
  ↓
core             ← pure computation (Result<T,E>, domain models)
```

---

## Core Pipeline

```text
ValidationEngine
      ↓
ConstraintSolver          (math only — StrategyAlgorithm plugins)
      ↓
StrategyBuilder           (SolverOutput → Strategy domain model)
      ↓
OptimizationEngine        (uses Solver — Sprint 3)
      ↓
SimulationEngine          (evaluates Strategy — not input to Optimization)
      ↓
ReportGenerator
```

---

## Key Principles

| Principle                 | Detail                                                   |
| ------------------------- | -------------------------------------------------------- |
| Pure core                 | No React, no throw — use `Result<T,E>`                   |
| Domain models             | `src/core/models/` — no raw literals in engine           |
| Plugin strategies         | `StrategyAlgorithm` interface per profit mode            |
| Solver ≠ Builder          | Solver solves math; Builder shapes UI/export model       |
| Optimization ≠ Simulation | Optimization finds optimal plan; Simulation evaluates it |

---

## Tech & Structure

- **Stack:** `docs/TECH-STACK.md` (FROZEN)
- **Folders:** `docs/FOLDER-STRUCTURE.md` (FROZEN)
- **Contracts:** `docs/CONTRACTS.md` v2.0.0

---

## Tests

- `tests/fixtures/` — golden JSON
- `tests/architecture/` — layer import rules

See `system-map.md` for full dependency graph.
