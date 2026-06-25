# Spec 006 — Statistics Builder

**Sprint:** 2.5 — **FROZEN** (ADR-035)

Compute **derived data** from a built `Strategy`.

**Prerequisite:** StrategyBuilder (Sprint 2.4)

**Path:** `src/core/statistics-builder/`

---

## Responsibility

```text
Strategy  →  StrategyStatistics
```

Derived fields:

- `roundCount`
- `requiredBankrollAmount`
- `maximumBetAmount` / `minimumBetAmount` / `averageBetAmount`
- `expectedProfitAmount` (terminal profit)

Statistics are **not** part of `Strategy` or `Round`.

---

## Philosophy (ADR-035)

StatisticsBuilder is **observational, never transformational**:

```text
observe → derive → return
```

- Must **not** mutate `Strategy`
- Must **not** call `ConstraintSolver` or `ValidationEngine`
- Must **not** read `CalculationRequest`
- All derived values from `Strategy` aggregate only

**Future:** SimulationEngine uses `Strategy` only — not `StrategyStatistics`.

---

## API

```typescript
buildStatistics(strategy: Strategy): StrategyStatistics
```

See `docs/design/statistics-builder-spec.md`.
