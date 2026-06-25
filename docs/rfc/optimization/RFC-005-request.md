# RFC-005 — Optimization Request & Result

**Status:** Draft — **ready for maintainer review** (RFC-003 accepted)  
**Prerequisite:** RFC-002 ✅, RFC-003 ✅, RFC-004 (review)  
**Note:** Types project domain rules — not the source of truth.

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

  /** Hard constraints — e.g. bankroll ceiling */
  constraints: OptimizationConstraints;

  /** Which knobs may change (RFC-002) */
  searchSpace: OptimizationSearchSpace;
}

interface OptimizationConstraints {
  /** Primary v1 constraint */
  bankrollLimit: number;
}

interface OptimizationSearchSpace {
  /** Round reduction allowed (RFC-002 A4) */
  allowRoundReduction?: boolean;
  /** Profit may decrease (RFC-002 A5) — default true when optimizing */
}
```

No `objective` enum for v1 — objective is fixed: **closest feasible to intent** (RFC-003).

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
  /** Human-readable — required for UI (RFC-003) */
  summary: string;
  /** Optional structured detail */
  details?: string[];
}
```

**Rejected for v1:** `alternatives[]`, `partial`, ranked lists, Pareto sets.

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

## Pipeline

```text
OptimizationRequest
  → generate candidates ∈ N(intent, searchSpace) monotonically
  → Core public API per candidate
  → filter by constraints.bankrollLimit
  → select I* by lexicographic distance (RFC-004)
  → build explanation
  → OptimizationResult (one answer or failure)
```

---

## Open questions

- [ ] Error code catalog beyond `NO_FEASIBLE_SOLUTION`?
- [ ] Module path: `src/optimization/`?
- [ ] SemVer for Optimization module vs Core?

---

## References

- [RFC-002 Assumptions](RFC-002-assumptions.md)
- [RFC-003 Domain](RFC-003-domain.md)
- [RFC-004 Mathematical Model](RFC-004-mathematical-model.md)
