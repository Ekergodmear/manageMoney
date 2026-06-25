# Folder Structure Contract

**Status:** FROZEN — Sprint 0.5 (rev. 2 — user approved)  
**Rule:** Do NOT create, rename, move, or delete top-level folders without ADR + user approval.

---

## Layer Model

```text
pages
  ↓
features
  ↓
application
  ↓
core
```

**Never skip layers.** Pages never import `core` or `application` directly.

---

## Root Layout

```text
earnmoney/
├── .cursor/rules/
├── .memory-bank/
├── benchmarks/
├── docs/
├── src/
├── tests/
│   ├── architecture/
│   ├── fixtures/
│   └── unit/
├── CHANGELOG.md
├── package.json
├── pnpm-lock.yaml
└── …configs
```

---

## `src/` — LOCKED

```text
src/
├── application/                 # Orchestration — no pure math here
│   ├── dto/                     # Input DTOs (CalculationRequest — NOT domain models)
│   ├── strategy/
│   │   ├── generateStrategy.ts
│   │   ├── simulateStrategy.ts
│   │   └── optimizeStrategy.ts
│   └── validation/
├── core/                        # Pure computation — zero React
│   ├── models/                  # Domain models (Round, Strategy, amounts…)
│   ├── contracts/               # Result, ValidationResult, StrategyResult
│   ├── algorithms/              # StrategyAlgorithm plugins
│   ├── validation/              # ValidationEngine
│   ├── solver/                  # ConstraintSolver — bet sequence → Strategy
│   ├── strategy-builder/        # StrategyBuilder — transform → Strategy
│   ├── statistics-builder/      # StatisticsBuilder — derived metrics
│   ├── simulation/              # SimulationEngine — evaluate Strategy
│   ├── optimization/            # OptimizationEngine — uses Solver
│   ├── report/                  # ReportGenerator (Sprint Export)
│   └── utils/
├── features/                    # Feature modules (UI logic, no math)
│   └── planner/
├── components/                  # Shared UI components (Sprint 6+)
├── hooks/                       # React hooks — wrap features/application
└── pages/                       # Route entry points (Sprint 6+)
```

---

## Layer Rules

| Rule | Detail                                                                                        |
| ---- | --------------------------------------------------------------------------------------------- |
| L1   | `core/` — **zero** React imports; pure functions; `Result<T,E>` not throw                     |
| L2   | `application/` — orchestrates core; no UI; no React                                           |
| L3   | `features/` — may import `application/`; **never** `core/` directly                           |
| L4   | `pages/` — import `features/` only                                                            |
| L5   | `components/` — import `features/` or props only; **never** `core/`                           |
| L6   | `hooks/` — import `features/` or `application/`; **never** `core/` directly                   |
| L7   | Domain models in `core/models/` — contracts in `core/contracts/` — DTOs in `application/dto/` |

---

## `tests/` — LOCKED

```text
tests/
├── architecture/          # Import boundary rules
├── fixtures/              # Golden JSON (x20-50-rounds.json, etc.)
└── unit/                  # Mirrors src/core + application
```

---

## Path Aliases (Sprint 1)

```
@/application/*
@/core/models
@/core/algorithms
@/core/validation
@/core/solver
@/core/strategy-builder
@/core/simulation
@/core/optimization
@/core/report
@/core/utils
@/features/*
@/components/*
@/hooks/*
@/pages/*
```

---

## Forbidden Patterns

| Pattern                  | Reason                                 |
| ------------------------ | -------------------------------------- |
| `pages/` → `@/core/*`    | Must go through features → application |
| `features/` → `@/core/*` | Must use application layer             |
| `src/services/`          | Use `application/`                     |
| `src/lib/`               | Use `core/utils/`                      |
| Throw in core public API | Use `Result<T,E>`                      |

---

## Enforcement

- `tests/architecture/` — rules A1–A15
- Review Agent checks every sprint
- dependency-cruiser optional Sprint 4+

---

_Matches `system-map.md`. Paths win over module names._
