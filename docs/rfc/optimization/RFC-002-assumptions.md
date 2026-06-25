# RFC-002 — Optimization Assumptions

**Status:** ✅ **Accepted** (maintainer, 2026-06-25)  
**Prerequisite:** [RFC-001 Why](RFC-001-why-optimization.md)  
**Next:** [RFC-003 Domain](RFC-003-domain.md) — domain boundary locked; ready for review

---

## Purpose

Answer the **most important question before any code:**

> **Which parameters may Optimization change — and which are fixed facts of the game or user intent?**

This document locks the **domain boundary** for Optimization v1.

---

## Parameter classification

| Parameter          | Fixed | Optimizable | Condition / role                             |
| ------------------ | ----- | ----------- | -------------------------------------------- |
| `rewardMultiplier` | ✅    | ❌          | Environment — new request required to change |
| `minimumBet`       | ✅    | ❌          | Environment                                  |
| `betStep`          | ✅    | ❌          | Environment                                  |
| `roundCount`       | ⚠️    | ✅          | Only if `allowRoundReduction` enabled        |
| `targetProfit`     | ❌    | ✅          | Always (primary knob)                        |
| `requiredBankroll` | N/A   | Objective   | Derived — not an optimization variable       |

**This table is the authoritative Sprint 3 domain boundary.**

---

## Accepted assumptions

### A1 — RewardMultiplier (environment)

**Status:** ✅ Accepted

```text
RewardMultiplier is an environment parameter, not an optimization variable.
```

If the user analyzes **x20**, Optimization works with **M = 20**. It must not change to x25 or x30.

Optimization answers:

> _With current conditions, what is the best plan?_

Not:

> _Change the rules of the game._

If the UI offers a dropdown (x10 / x20 / x30), that creates a **new `CalculationRequest`** — it is **not** Optimization changing multiplier within a session.

---

### A2 — MinimumBet (fixed)

**Status:** ✅ Accepted

`minimumBet` is **fixed**. Optimization must not propose increasing minimum bet (e.g. 10k → 20k) unless the user creates a new request with a different minimum bet.

---

### A3 — BetStep (fixed)

**Status:** ✅ Accepted

`betStep` is **fixed**. Optimization must not change it.

---

### A4 — RoundCount (conditionally optimizable)

**Status:** ✅ Accepted

Optimization **may** propose reducing round count (e.g. 50 → 32) **only if** the caller enables `allowRoundReduction`.

If not enabled: round count is **fixed** for that optimization run.

Direction: **decrease only** (see A12 monotonic search).

---

### A5 — TargetProfit (optimizable)

**Status:** ✅ Accepted

`targetProfit` is the **primary optimization knob**.

Optimization may propose reductions (e.g. 100k → 90k) to improve feasibility or meet bankroll limits.

Must not increase profit beyond the user's stated goal (feasibility help, not greed).

Direction: **decrease only** unless a future RFC defines otherwise (see A12).

---

### A6 — RequiredBankroll (objective, not variable)

**Status:** ✅ Accepted

`requiredBankroll` is **not an input** and **not directly optimizable**.

It is a **derived objective metric** (from solver / statistics). Optimization minimizes or constrains it indirectly by changing allowed knobs.

---

### A7 — Solver (compose only)

**Status:** ✅ Accepted

Optimization **MUST NOT** change the solver algorithm or its objective (min Σ bet).

It may only **compose** the public `solve()` capability.

---

### A8 — Simulation (read-only evaluator)

**Status:** ✅ Accepted

Simulation is a **read-only evaluator**. Optimization may call `simulateWinAtRound`.

Simulation **must not** call Optimization. The existing DAG is preserved:

```text
Optimization → Core SDK (including Simulation)
```

Not the reverse.

---

### A9 — Strategy (no mutation)

**Status:** ✅ Accepted

Optimization does not mutate `Strategy`. Flow:

```text
request → solve → buildStrategy → strategy
```

A different strategy requires a **different request** through the pipeline — not in-place mutation.

---

### A10 — Statistics (read-only)

**Status:** ✅ Accepted

`buildStatistics` output is **read-only** for Optimization. No mutation of statistics objects to fake feasibility.

---

### A11 — Public API only

**Status:** ✅ Accepted

Optimization uses only:

```text
validateCalculationRequest
solve
buildStrategy
buildStatistics
simulateWinAtRound
```

Forbidden:

```text
import "@/core/..."
```

Deep imports and private Core surfaces are out of scope.

---

### A12 — Monotonic search

**Status:** ✅ Accepted

Optimization v1 must use **monotonic search** on each optimizable knob:

```text
targetProfit:  100k → 95k → 90k → …   (allowed)
               100k → 20k → 80k → 30k   (forbidden — non-monotonic jumps)
```

Each knob changes only in the **declared direction** (e.g. profit ↓, rounds ↓).

Non-monotonic heuristics require a **new RFC** — not v1.

---

## Additional fixed constraints

| ID  | Assumption                                   | Status                                  |
| --- | -------------------------------------------- | --------------------------------------- |
| —   | Validation rules and phases fixed            | ✅ Accepted                             |
| —   | `profitMode` fixed per request               | ✅ Accepted — mode change = new request |
| —   | Changing `rewardMultiplier` via Optimization | ❌ Rejected                             |

---

## Dependency rule

- RFC-003 (Domain) lists only **optimizable** parameters from the classification table.
- RFC-005 (Request) exposes flags matching A4 (`allowRoundReduction`) and objectives matching A6.
- No new knob without a new assumption ID + maintainer approval.

---

## Maintainer checklist

- [x] Classify each parameter — see classification table
- [x] `rewardMultiplier` = fixed (A1)
- [x] `minimumBet` = fixed (A2)
- [x] `betStep` = fixed (A3)
- [x] `targetProfit` = optimizable (A5)
- [x] `roundCount` = conditionally optimizable (A4)
- [x] A12 monotonic search
- [x] Domain boundary locked → **RFC-003 ready for review**

---

## References

- [RFC-001 Why](RFC-001-why-optimization.md)
- [RFC-003 Domain](RFC-003-domain.md)
- `src/application/dto/calculation-request.ts` (on `main`)
