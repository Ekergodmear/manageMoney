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

**Policy boundary (locked):** policy generates candidates only — no feasibility, bankroll, or pipeline calls.

Search engine **consumes** `SearchPolicy`; it does not embed granularity rules.

---

## Sprint 3.2 phases

### 3.2A — Search Policy (spec + tests) ✅

- `SearchPolicy` — policy object, **not** plugin point (single `defaultSearchPolicy`)
- Pure, deterministic, minimal-step — gate before 3.2B
- `search-policy/` must not import Core SDK

**Locked invariants (maintainer sign-off):**

| Invariant | Rule |
| --------- | ---- |
| Candidate only | Policy returns next candidate; never evaluates |
| Terminal `null` | `nextProfit(x) === null` → idempotent on repeat |
| Mode guard | `fixedAmount` steps; `breakEven` / `percentage` → `null` |
| Intent immutable | `nextProfit` / `nextRoundCount` do not mutate `intent` |
| O(1) policy | No loops, no large allocations — see `PERFORMANCE-CONTRACT.md` |

**Gate (maintainer):** Pure · Deterministic · Minimal-step — enforced by tests

### 3.2B — Profit search only ✅

```text
Identity
    ↓ (not feasible)
candidate = policy.nextProfit(intent, currentProfit, profitGranularity)
    ↓
while (candidate !== null)
    evaluate(candidate) via @/public
    feasible? → return PROFIT_REDUCED (first feasible wins)
    candidate = policy.nextProfit(...)
    ↓
NO_FEASIBLE_SOLUTION
```

- No round reduction (`nextRoundCount` not used until 3.2C)
- Engine must not inline `profit -= granularity` — architecture test
- **First Feasible Wins:** stop at first feasible reduced profit (RFC-004 Minimal Change)
- Explanation: `PROFIT_REDUCED` when applicable
- Identity invariant preserved

**Frozen after sign-off:** profit search semantics — no further changes before 3.2C.2 ships.

**Backlog (before 3.2C.2):** extract `createProfitCandidate(intent, profit)` — candidate construction must not live inline in `optimize()`. Policy decides the next value; a single helper owns `CalculationRequest` shaping.

### 3.2C.1 — Profit search freeze + Monotonic Budget ✅

Profit search is complete. Property tests (no new features):

| Property | Test file |
| -------- | --------- |
| Monotonic Budget | `optimize-profit-properties.test.ts` |
| Prefix Stability + First Feasible Wins | `optimize-profit-properties.test.ts` |

**Frozen:** profit search semantics — no changes until 3.2C.2 ships.

### 3.2C.2 — Round reduction

Independent unit — changes search space; do not mix with 3.2C.1 in one commit.

```text
profit loop (at fixed round level)
    → round decrement via policy.nextRoundCount
    → profit loop again
```

- Explanation: `PROFIT_AND_ROUNDS_REDUCED` / `ROUNDS_REDUCED` as needed
- `createRoundCandidate(intent, roundCount)` — same candidate-builder pattern as profit

### 3.3 — Verification (after 3.2C.1 + 3.2C.2 frozen)

Property-based verification of **full** Optimization — only after both profit and round search are frozen:

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

- [x] Identity property still holds after every 3.2 sub-phase
- [x] No search state in `OptimizationResult`
- [x] `src/public/index.ts` unchanged
- [x] Architecture isolation test still passes
- [x] Monotonic budget property tested in 3.2C.1
- [x] Prefix Stability tested in 3.2C.1
- [ ] Round reduction in 3.2C.2 (separate commit)

---

## References

- `docs/rfc/optimization/RFC-004-mathematical-model.md`
- `docs/rfc/optimization/OPTIMIZATION-INVARIANTS.md`
- `docs/design/sprint-3-gate.md`
