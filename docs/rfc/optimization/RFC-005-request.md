# RFC-005 — Optimization Request & Result

**Status:** Draft — **last in review order**  
**Prerequisite:** RFC-002, RFC-003, RFC-004 accepted  
**Note:** Request types are a **projection** of domain + assumptions — not the source of truth.

---

## Purpose

Sketch the OptimizationEngine module contract (not Core SDK export) before implementation.

---

## OptimizationRequest (illustrative)

```typescript
// Not implemented — not frozen

interface OptimizationRequest {
  base: CalculationRequest;
  constraints: OptimizationConstraints;
  objective: OptimizationObjective;
  /** Must match RFC-002 accepted knobs only */
  searchSpace: OptimizationSearchSpace;
}
```

`searchSpace` flags must mirror RFC-002 assumption IDs (e.g. allow profit reduction iff A6 accepted).

---

## OptimizationResult (illustrative)

```typescript
type OptimizationResult =
  | { kind: 'success'; recommendation: RecommendedPlan; alternatives?: RecommendedPlan[] }
  | { kind: 'partial'; bestEffort: RecommendedPlan; reason: string }
  | { kind: 'failure'; error: OptimizationError };

interface RecommendedPlan {
  request: CalculationRequest;
  statistics: StrategyStatistics;
  rationale?: string;
}
```

---

## Pipeline

```text
OptimizationRequest
  → candidate CalculationRequest(s) ∈ N(I₀, S)
  → public Core SDK pipeline per candidate
  → rank / select per RFC-004
  → OptimizationResult
```

---

## Open questions

- [ ] One-shot vs iterative suggestions?
- [ ] Error codes separate from `ValidationCodes`?
- [ ] Module path: `src/optimization/` in monorepo?

---

## References

- [RFC-002 Assumptions](RFC-002-assumptions.md)
- [RFC-003 Domain](RFC-003-domain.md)
- [RFC-004 Mathematical Model](RFC-004-mathematical-model.md)
