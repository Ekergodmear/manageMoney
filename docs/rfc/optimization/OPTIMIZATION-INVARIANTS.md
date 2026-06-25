# Optimization — Module Invariants

**Status:** Locked — regression if broken  
**Branch:** `optimization-v1`  
**Sprint 3.1:** Identity proven. **Sprint 3.2:** Search + profit/round frozen. **Sprint 3.3:** Formal verification — **Production Ready** (internal module).

---

## Architectural invariant

```text
Optimization → @/public → Core capabilities
```

Optimization **never** deep-imports `@/core/solver/*`, `validation`, `statistics-builder`, or `simulation`.

Enforced by: `tests/architecture/optimization-isolation.test.ts`

Core SDK does not know Optimization exists.

---

## SearchPolicy boundary (Sprint 3.2A+)

SearchPolicy answers **only**:

```text
"Candidate tiếp theo là gì?"
```

It **must not**:

- know whether a candidate is feasible
- know `bankrollLimit`
- call `validate()`, `solve()`, or `buildStatistics()`
- return evaluation results — only `ProfitAmount | null` or `RoundCount | null`

```text
SearchPolicy → candidate
Engine       → evaluate(candidate)
```

**Not:** `SearchPolicy → candidate + evaluation`

SearchPolicy is **pure**, **O(1)** per step (no loops, no large allocations), and **does not mutate** `intent`.

Mode guard (deterministic):

| `targetProfit.mode` | `nextProfit` |
| ------------------- | ------------ |
| `fixedAmount`       | steps down   |
| `breakEven`         | `null`       |
| `percentage`        | `null`       |

**Terminal idempotence:** if `nextProfit(x) === null`, every subsequent call with the same `x` returns `null`.

Tests: `tests/unit/optimization/search-policy.test.ts`

---

## Engine movement rule (Sprint 3.2B+)

`optimize()` must move search state **only** through:

```text
policy.nextProfit(...)
policy.nextRoundCount(...)   // when round search ships (3.2C)
```

Forbidden in `optimize.ts`: inline `profit -= granularity`, `roundCount - 1`, or equivalent.

Enforced by: `tests/architecture/optimization-isolation.test.ts`

---

## Identity property (module axiom)

```text
If requiredBankroll(intent) ≤ bankrollLimit
Then optimize(request) returns intent unchanged
     with explanation.reason = IDENTITY
```

Not an example — a **theorem of the module** for all Sprint 3 refactors.

Property tests: `tests/unit/optimization/optimize-identity.test.ts`

---

## First Feasible Wins (Sprint 3.2B+)

Profit search steps down monotonically. The engine **stops at the first feasible candidate** — it does not continue to lower profits.

This is RFC-004 **Minimal Change** at implementation level.

Tests: `tests/unit/optimization/optimize-profit-search.test.ts`

---

## Formal verification (Sprint 3.3 — frozen)

| ID | Property | Test |
| -- | -------- | ---- |
| O-P1 | Determinism | `optimize-formal-properties.test.ts` |
| O-P2 | Minimal change (lexicographic, bounded) | `optimize-formal-properties.test.ts` |
| O-P3 | Explanation consistency | `optimize-formal-properties.test.ts` |
| O-P4 | Failure completeness (bounded) | `optimize-formal-properties.test.ts` |
| O-D1 | Differential vs brute-force | `optimize.differential.test.ts` |

See `docs/design/optimization-formal-verification.md`.

---

From RFC-004:

```text
If budget₁ < budget₂
Then optimizedProfit(result₁) ≤ optimizedProfit(result₂)
```

Property-based test in Sprint 3.2C.1 — **verified, profit search frozen**.

Tests: `tests/unit/optimization/optimize-profit-properties.test.ts`

---

## Prefix Stability (Sprint 3.2C.1)

Candidate sequence is independent of `bankrollLimit`:

```text
profitGranularity = 5k
100 → 95 → 90   is always a prefix of   100 → 95 → 90 → 85 → 80 → ...
```

Search must not branch differently per budget. Property test in 3.2C.1 — **verified**.

Tests: `tests/unit/optimization/optimize-profit-properties.test.ts`

---

## Candidate construction (backlog — before 3.2C.2)

`optimize()` orchestrates only. Request shaping belongs in dedicated helpers:

```text
policy.nextProfit(...)  →  value
createProfitCandidate(intent, value)  →  CalculationRequest
```

Not inline spread/`targetProfit` in `optimize()`. Shipped in `candidates/` (3.2C.2).

---

## Nested evaluation order (Sprint 3.2C.2)

RFC-004 nested prefix — profit exhausted at `R₀`, then profit resets at each lower round:

```text
(100k,50) → (95k,50) → … → (100k,49) → (95k,49) → …
```

Tests: `tests/unit/optimization/optimize-nested-properties.test.ts`

---

## Round monotonicity (Sprint 3.2C.2)

- `allowRoundReduction: false` → round count unchanged on success
- Round levels step by `policy.nextRoundCount` only (50 → 49 → 48, never skips)

Tests: `tests/unit/optimization/optimize-nested-properties.test.ts`

---

## Result boundary

`OptimizationResult` contains **only**:

- `request` (on success)
- `explanation` (structured)
- `code` (on failure)

**Never** in result: iterations, visited states, search nodes, attempts.

Search trace is implementation detail — not product contract.

---

## Public API boundary

`src/public/index.ts` **unchanged** until semantics, API, and explanation are stable.

Optimization remains an internal module (`src/core/optimization/`).

---

## References

- `docs/design/sprint-3.2-spec.md`
- `docs/rfc/optimization/RFC-004-mathematical-model.md`
- `docs/rfc/optimization/RFC-005-request.md`
- `docs/PERFORMANCE-CONTRACT.md` — SearchPolicy O(1) section
