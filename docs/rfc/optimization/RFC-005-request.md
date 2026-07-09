# RFC-005 — Optimization Request & Result

**Status:** ✅ **Accepted** (maintainer, 2026-06-25)  
**Prerequisite:** RFC-002 ✅, RFC-003 ✅, RFC-004 ✅  
**Gate:** RFC stack complete — **Sprint 3 implementation may begin** on `optimization-v1`

---

## Purpose

Freeze the OptimizationEngine **module contract** for 2–3 years: minimal request, structured result, no Core SDK v1 changes.

This is **not** a Core SDK v1 public export. It is a new capability module that **composes** frozen public APIs.

---

## Module location

```text
src/core/optimization/
```

Optimization is a **Core capability** (like validation, solver, simulation) — not `src/optimization/` at repo root.

Future monorepo:

```text
packages/constraint-engine/src/core/optimization/
```

---

## Public API boundary

Optimization **does not**:

- Modify `solve()`, `validateCalculationRequest()`, `buildStrategy()`, `buildStatistics()`, `simulateWinAtRound()`
- Add overloads to Core capabilities
- Add exports to `src/public/index.ts` without a future ADR + SemVer gate

Optimization **only composes** the five frozen capabilities from outside (or via internal composition that respects the same contract).

**Optimization errors are separate from Validation.** `ValidationCodes` never appear as Optimization failure codes.

---

## OptimizationRequest (frozen shape)

Only **intent**, **constraints**, and **policy**. No derived data, cache, statistics, or search state.

```typescript
interface OptimizationRequest {
  /** User intent — original plan (RFC-003) */
  intent: CalculationRequest;

  /** Hard constraint: requiredBankroll ≤ bankrollLimit */
  bankrollLimit: BankrollAmount;

  /** RFC-002 A4 — enables round dimension in search */
  allowRoundReduction: boolean;

  /**
   * Profit search step — domain policy, NOT betStep (RFC-004).
   * Example: 5_000
   */
  profitGranularity: ProfitAmount;
}
```

### Invariant

> **OptimizationRequest is never self-contradictory.**

Rejected on request:

- `profit_min`, `rounds_min` — **search boundaries**, not user input
- Derived fields that can drift when `intent` changes
- Precomputed statistics or strategy

### SearchBounds (internal only)

Not part of public contract. Computed by OptimizationEngine:

```text
profit sequence: targetProfit(intent) → … → 0  (step: profitGranularity)
rounds sequence: rounds(intent) → … → rounds_min  (if allowRoundReduction)
```

`profit_min` / `rounds_min` are derived from validation rules + intent — **never** sent by caller.

---

## Identity property

If intent is already feasible under the limit:

```text
requiredBankroll(intent) ≤ bankrollLimit
```

then Optimization **must** return **exactly** `intent` unchanged.

No further "optimization". Explanation uses reason `IDENTITY`.

**Property-based test** candidate (Sprint 3.5).

---

## OptimizationResult

### Success

```typescript
interface OptimizationSuccess {
  kind: 'success';
  request: CalculationRequest;
  explanation: OptimizationExplanation;
}
```

No `strategy`, `statistics`, or search metadata in the result. Consumers run Core pipeline if they need strategy/stats.

### Failure

```typescript
interface OptimizationFailure {
  kind: 'failure';
  code: OptimizationErrorCode;
  explanation: OptimizationExplanation;
}

type OptimizationErrorCode = 'NO_FEASIBLE_SOLUTION';
// Future optimization-internal codes via new RFC — not ValidationCodes
```

v1: one success or one failure. No alternatives list.

---

## OptimizationExplanation (structured contract)

Not a free-form English string. UI renders from structured fields.

```typescript
interface OptimizationExplanation {
  /** Machine reason — UI maps to copy / i18n */
  reason: OptimizationReason;

  /** Amount reduced from intent profit (0 if unchanged) */
  profitReducedBy: ProfitAmount;

  /** Rounds reduced from intent (0 if unchanged) */
  roundsReducedBy: number;
}

type OptimizationReason =
  | 'IDENTITY'
  | 'PROFIT_REDUCED'
  | 'ROUNDS_REDUCED'
  | 'PROFIT_AND_ROUNDS_REDUCED'
  | 'NO_FEASIBLE_SOLUTION';
```

Example mapping (informative, not normative copy):

| reason                      | UI intent                                               |
| --------------------------- | ------------------------------------------------------- |
| `IDENTITY`                  | Intent already fits bankroll                            |
| `PROFIT_REDUCED`            | Profit lowered, rounds preserved                        |
| `ROUNDS_REDUCED`            | Rounds lowered (profit unchanged at best lexicographic) |
| `PROFIT_AND_ROUNDS_REDUCED` | Both knobs adjusted                                     |
| `NO_FEASIBLE_SOLUTION`      | Failure explanation                                     |

---

## Pipeline

```text
OptimizationRequest
  → if identity property applies → return intent + IDENTITY
  → build SearchBounds (internal)
  → nested search (RFC-004)
  → Core public API per candidate
  → OptimizationSuccess | OptimizationFailure
```

---

## Mapping to RFC-002–004

| API field             | Model                        |
| --------------------- | ---------------------------- |
| `intent`              | `I₀`                         |
| `bankrollLimit`       | `B_max`                      |
| `allowRoundReduction` | round dimension in `N`       |
| `profitGranularity`   | profit step in nested search |
| Success `request`     | minimal feasible `I*`        |
| `explanation`         | structured product contract  |

---

## Sprint 3 pre-implementation checklist

- [x] Request contains no derivable / search-boundary fields
- [x] Result is product data only — no search state leakage
- [x] Explanation is structured — not ad-hoc strings
- [x] Optimization does not extend Core SDK v1 public surface
- [x] Identity property formalized
- [x] Module path: `src/core/optimization/`
- [x] Validation / Optimization error boundary documented

**RFC-001 → RFC-005 complete. Implementation gate: open.**

---

## References

- [RFC-002 Assumptions](RFC-002-assumptions.md)
- [RFC-003 Domain](RFC-003-domain.md)
- [RFC-004 Mathematical Model](RFC-004-mathematical-model.md)
- `docs/design/sprint-3-gate.md`
