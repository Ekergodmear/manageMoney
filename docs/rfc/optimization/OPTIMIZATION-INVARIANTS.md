# Optimization — Module Invariants

**Status:** Locked — regression if broken  
**Branch:** `optimization-v1`  
**Sprint 3.1:** Identity proven. **Sprint 3.2A:** SearchPolicy locked. **Sprint 3.2B:** Profit search + First Feasible Wins.

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

## Monotonic budget property (Sprint 3.2C.1)

From RFC-004:

```text
If budget₁ < budget₂
Then optimizedProfit(result₁) ≤ optimizedProfit(result₂)
```

Property-based test in Sprint 3.2C.1 — freeze profit search semantics first.

---

## Prefix Stability (Sprint 3.2C.1)

Candidate sequence is independent of `bankrollLimit`:

```text
profitGranularity = 5k
100 → 95 → 90   is always a prefix of   100 → 95 → 90 → 85 → 80 → ...
```

Search must not branch differently per budget. Property test in 3.2C.1.

---

## Candidate construction (backlog — before 3.2C.2)

`optimize()` orchestrates only. Request shaping belongs in dedicated helpers:

```text
policy.nextProfit(...)  →  value
createProfitCandidate(intent, value)  →  CalculationRequest
```

Not inline spread/`targetProfit` in `optimize()`. Required before round reduction ships.

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
