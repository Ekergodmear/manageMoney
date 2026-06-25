# RFC-005 — Optimization Request & Result

**Status:** Draft — **ready for final maintainer review** (RFC-004 accepted)  
**Prerequisite:** RFC-002 ✅, RFC-003 ✅, RFC-004 ✅  
**Note:** Types are a projection of RFC-002–004 — not the source of truth.

---

## Purpose

Module-level contract for OptimizationEngine (not Core SDK export).

---

## OptimizationRequest (illustrative)

```typescript
// Not implemented — not frozen

interface OptimizationRequest {
  /** Original request — user intent (RFC-003) */
  intent: CalculationRequest;

  /** Hard constraints */
  constraints: OptimizationConstraints;

  /** Search knobs (RFC-002) */
  searchSpace: OptimizationSearchSpace;

  /**
   * Profit search step — domain policy, NOT betStep (RFC-004).
   * Example: 1000
   */
  profitGranularity: number;
}

interface OptimizationConstraints {
  bankrollLimit: number;
}

interface OptimizationSearchSpace {
  /** Round reduction allowed (RFC-002 A4) */
  allowRoundReduction?: boolean;
}
```

v1 objective is implicit: **minimal feasible request** (RFC-003 / RFC-004).

---

## OptimizationResult (illustrative)

```typescript
type OptimizationResult = OptimizationSuccess | OptimizationFailure;

interface OptimizationSuccess {
  kind: 'success';
  request: CalculationRequest;
  strategy: Strategy;
  statistics: StrategyStatistics;
  explanation: OptimizationExplanation;
}

interface OptimizationFailure {
  kind: 'failure';
  code: 'NO_FEASIBLE_SOLUTION';
  explanation: OptimizationExplanation;
}

interface OptimizationExplanation {
  summary: string;
  details?: string[];
}
```

**v1:** one result only — no alternatives, Pareto, or ranked lists.

---

## Mapping to mathematical model

| Request field                     | RFC                                    |
| --------------------------------- | -------------------------------------- |
| `intent`                          | `I₀` — user intent                     |
| `constraints.bankrollLimit`       | `B_max`                                |
| `searchSpace.allowRoundReduction` | enables round dimension in `N`         |
| `profitGranularity`               | profit decrement step in nested search |
| Success `request`                 | minimal feasible `I*`                  |
| `explanation`                     | RFC-003 OptimizationExplanation        |

---

## Example explanation (success)

```text
Unable to satisfy 100k profit with 500k bankroll.
Target profit reduced to 31k while preserving 50 rounds.
```

## Example explanation (failure)

```text
No feasible plan found within search limits.
100 rounds and 100M profit cannot be satisfied with 20k bankroll.
```

---

## Pipeline (summary)

```text
OptimizationRequest
  → nested search (RFC-004 normative algorithm)
  → Core public API per candidate
  → minimal feasible I* or failure
  → OptimizationResult
```

---

## Open questions (RFC-005)

- [ ] `profit_min` / `rounds_min` — derived from validation rules or explicit fields?
- [ ] Module path: `src/optimization/`?
- [ ] Error code catalog beyond `NO_FEASIBLE_SOLUTION`?

---

## Maintainer checklist

- [ ] Request fields cover RFC-004 (incl. `profitGranularity`)
- [ ] Result shape matches RFC-003 (one answer + explanation)
- [ ] Ready to freeze → Sprint 3 implementation gate

---

## References

- [RFC-002 Assumptions](RFC-002-assumptions.md)
- [RFC-003 Domain](RFC-003-domain.md)
- [RFC-004 Mathematical Model](RFC-004-mathematical-model.md)
