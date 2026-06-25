# Data Flow Diagrams

**Status:** FROZEN — Sprint 2.3 (rev. 2.0)  
**Rule:** Every new public contract MUST add or extend a flow section here before implementation.

See: `docs/CONTRACTS.md`, `docs/DOMAIN-LANGUAGE.md`, `docs/MATHEMATICAL-SPECIFICATION.md`.

---

## End-to-End Pipeline

```text
UI / Client
     ↓
CalculationRequest          (@/application/dto)
     ↓
ValidationEngine            (structural | business | mathematical)
     ↓
ValidatedCalculationRequest
     ↓
ConstraintSolver            (bet sequence → Strategy)
     ↓
StrategyBuilder             (transform → domain Strategy)
     ↓
StatisticsBuilder           (derived metrics → StrategyStatistics)
     ↓
StrategyResult              (@/core/contracts — application assembles)
     ↓
UI / Client
```

Future branches:

```text
OptimizationRequest  → OptimizationEngine (Sprint 3) → StrategyResult
SimulationRequest    → SimulationEngine (Sprint 2.6) → Simulation
StrategyAlgorithm    → Plugin layer (Sprint 4 only)
```

---

## ConstraintSolver

```text
ValidatedCalculationRequest
     ↓
State machine (AccumulatedSpent)
     ↓
Strategy { rounds }
```

Returns **`Strategy` only** — not `StrategyResult`, not statistics.  
See: `docs/design/constraint-solver-algorithm.md`

---

## StrategyBuilder

```text
Strategy (from solver)
     ↓
normalize / structural validate
     ↓
Strategy (domain)
```

No statistics. Sprint 2.4.

---

## StatisticsBuilder

```text
Strategy
     ↓
compute derived fields (bankroll, avg bet, max bet, …)
     ↓
StrategyStatistics
```

Sprint 2.5. Statistics are **not** stored on `Strategy` or `Round`.

---

## StrategyResult

```text
ConstraintSolver   → strategy
ValidationEngine   → validation (from earlier step)
StatisticsBuilder  → statistics
Application        → metadata
     ↓
StrategyResult { strategy, validation, statistics, metadata }
```

---

## Import Boundaries

```text
@/application/dto        → @/core/models (amount types only)
@/core/solver            → dto + models (no validation, no statistics)
@/core/strategy-builder  → models (no solver, no statistics)
@/core/statistics-builder → models (no solver)
features / UI            → @/application/* only
```
