# Sprint 3.2 — Search Strategy

**Status:** Planned — after Sprint 3.1 sign-off  
**Prerequisite:** Sprint 3.1A–3.1B ✅ (maintainer approved)  
**Branch:** `optimization-v1`

---

## Sprint 3.1 sign-off

**Sprint 3.1A–3.1B: APPROVED.**

Proven: Optimization is a **consumer** of `@/public`, not Solver v2.

See `docs/rfc/optimization/OPTIMIZATION-INVARIANTS.md`.

---

## Design principle for 3.2

Do **not** start with nested `for` loops in `optimize()`.

Start with **Search Strategy** documentation, then:

```text
RFC-004
    ↓
SearchPolicy
    ↓
SearchEngine (consumes policy)
    ↓
optimize() orchestrates
```

---

## Search flow (normative)

```text
1. Identity check
       ↓ (not feasible under bankrollLimit)
2. Profit reduction loop (monotonic ↓ by profitGranularity)
       ↓ (exhausted at fixed rounds)
3. Round reduction loop (if allowRoundReduction)
       ↓
4. NO_FEASIBLE_SOLUTION
```

Each step evaluates candidates via **public API pipeline only**.

---

## SearchPolicy interface (Sprint 3.2A)

Separate policy from engine — RFC-004 defines math; policy defines steps.

```typescript
// Single v1 implementation — not a Strategy Pattern plugin point

interface SearchPolicy {
  nextProfit(
    intent: CalculationRequest,
    currentProfit: ProfitAmount,
    profitGranularity: ProfitAmount,
  ): ProfitAmount | null;

  nextRoundCount(intent: CalculationRequest, currentRoundCount: RoundCount): RoundCount | null;
}
```

Pure · deterministic · minimal-step. Policy does not import Core SDK.

Search engine **consumes** `SearchPolicy`; it does not embed granularity rules.

---

## Sprint 3.2 phases

### 3.2A — Search Policy (spec + tests) ✅

- `SearchPolicy` — policy object, **not** plugin point (single `defaultSearchPolicy`)
- Pure, deterministic, minimal-step — gate before 3.2B
- `search-policy/` must not import Core SDK

**Gate (maintainer):** Pure · Deterministic · Minimal-step — enforced by tests

### 3.2B — Profit search only

```text
Identity → profit loop → return first feasible
```

- No round reduction
- Explanation: `PROFIT_REDUCED` when applicable
- Identity invariant preserved

### 3.2C — Nested search

Full RFC-004 nested algorithm:

```text
profit loop (outer per round level)
    → round decrement
    → profit loop again
```

- Monotonic budget property test (property-based)
- Explanation: `PROFIT_AND_ROUNDS_REDUCED` / `ROUNDS_REDUCED` as needed

### 3.3 — Verification (after 3.2C)

- Lexicographic optimality checks
- Stability (determinism)
- Monotonicity w.r.t. `bankrollLimit`
- Performance contract (below)

---

## Performance contract (Sprint 3.2)

Nested search complexity:

```text
O(P × R)
```

| Symbol | Meaning                                          |
| ------ | ------------------------------------------------ |
| P      | Profit steps: ⌈targetProfit / profitGranularity⌉ |
| R      | Round steps: roundCount (if allowRoundReduction) |

Each step = one public API pipeline evaluation.

Heuristics later → separate RFC + benchmarks.

---

## Review checklist (maintainer)

- [ ] Identity property still holds after every 3.2 sub-phase
- [ ] No search state in `OptimizationResult`
- [ ] `src/public/index.ts` unchanged
- [ ] Architecture isolation test still passes
- [ ] Monotonic budget property tested in 3.2C

---

## References

- `docs/rfc/optimization/RFC-004-mathematical-model.md`
- `docs/rfc/optimization/OPTIMIZATION-INVARIANTS.md`
- `docs/design/sprint-3-gate.md`
