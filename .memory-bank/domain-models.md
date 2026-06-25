# Domain Models

**Path:** `src/core/models/`  
**Sprint:** 2.1

Engine modules operate on these models — not raw object literals.

---

## Result

```typescript
type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

All core public functions return `Result`. Never throw.

---

## StrategyInput (DTO)

User-facing input. Immutable. See `CONTRACTS.md`.

---

## Bet

```typescript
interface Bet {
  readonly amount: number;
  readonly step: number;
  readonly minimum: number;
}
```

---

## Round

```typescript
interface Round {
  readonly index: number;
  readonly bet: Bet;
  readonly reward: number;
  readonly spent: number;
  readonly profit: number;
  readonly roi: number;
}
```

---

## Strategy

```typescript
interface Strategy {
  readonly rounds: readonly Round[];
  readonly summary: StrategySummary;
  readonly goal: OptimizationGoal;
}
```

Output of **StrategyBuilder**. Input to **SimulationEngine** and **ReportGenerator**.

---

## Simulation

Output of SimulationEngine — evaluation of a Strategy at a win point.

---

## Constraint

Snapshot of active constraints during solve (for debugging/export).

---

## OptimizationGoal

Target for OptimizationEngine (`min-bankroll`, `min-max-bet`, future goals).

---

## SolverOutput

Internal output of ConstraintSolver — input to StrategyBuilder.

Not exposed to UI directly.

---

## StrategyAlgorithm

Plugin interface in `@/core/algorithms`. See `CONTRACTS.md`.

---

_Glossary terms: `glossary.md`. Contracts: `docs/CONTRACTS.md` v2.0.0._
