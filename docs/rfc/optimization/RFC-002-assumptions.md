# RFC-002 — Optimization Assumptions

**Status:** Draft — **maintainer must approve before RFC-003**  
**Prerequisite:** [RFC-001 Why](RFC-001-why-optimization.md)  
**Next:** [RFC-003 Domain](RFC-003-domain.md)

---

## Purpose

Answer the **most important question before any code:**

> **Which parameters may Optimization change — and which are fixed facts of the game or user intent?**

If assumptions are wrong, the mathematical model and `OptimizationRequest` will be rewritten repeatedly.

This document is ~1 page of **locked domain facts**, not algorithm design.

---

## Assumption format

| ID  | Assumption | Status                               | Notes |
| --- | ---------- | ------------------------------------ | ----- |
| —   | —          | `proposed` / `accepted` / `rejected` | —     |

---

## Game vs user parameters

Some fields describe the **game** (e.g. Bingo18 x20).  
Some describe **user choices** (target profit, round count).

Optimization may only vary parameters classified as **user-adjustable** unless product explicitly allows game-parameter search.

---

## Proposed assumptions (v1 — for maintainer review)

### Fixed by game / product (Optimization must NOT change)

| ID  | Assumption                                                   | Status       | Rationale                                        |
| --- | ------------------------------------------------------------ | ------------ | ------------------------------------------------ |
| A1  | `rewardMultiplier` is fixed for a session (e.g. Bingo18 x20) | **proposed** | Multiplier is a game property, not a tuning knob |
| A2  | `betStep` is fixed by platform rules                         | **proposed** | Step size is structural                          |
| A3  | Validation rules and phases are fixed                        | **accepted** | Core SDK contract                                |

### Possibly fixed (needs product decision)

| ID  | Assumption                                            | Status       | Question                                       |
| --- | ----------------------------------------------------- | ------------ | ---------------------------------------------- |
| A4  | `minimumBet` is fixed by user bankroll policy         | **proposed** | Or may Optimization suggest raising it?        |
| A5  | `profitMode` is fixed when user picks a strategy type | **proposed** | Or may Optimization switch fixed ↔ percentage? |

### User-adjustable (Optimization MAY change)

| ID  | Assumption                                                | Status       | Notes                                       |
| --- | --------------------------------------------------------- | ------------ | ------------------------------------------- |
| A6  | `targetProfit` may decrease (or adjust within mode rules) | **proposed** | Primary knob for "500k budget" scenario     |
| A7  | `rounds` may decrease                                     | **proposed** | Shorter plan → lower bankroll               |
| A8  | `targetProfit` may not increase beyond user's stated goal | **proposed** | Optimization is feasibility help, not greed |

### Explicitly rejected for v1

| ID  | Assumption                                 | Status                                                                                                                                  |
| --- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| A9  | Optimization may change `rewardMultiplier` | **rejected** (pending maintainer) — if multiplier is user-selectable from {x10,x20,x30}, revisit as **accepted** with discrete set only |
| A10 | Optimization may modify solver internals   | **rejected**                                                                                                                            |
| A11 | Optimization may call non-public Core APIs | **rejected**                                                                                                                            |

---

## Critical open decision: multiplier

> If `rewardMultiplier` is a **game constant** → **A1 accepted, A9 rejected**.  
> If `rewardMultiplier` is a **user dropdown** (x10 / x20 / x30) → Optimization may search that **finite set**; update A1/A9 accordingly.

**This is a product/domain decision, not a technical one.**

---

## Dependency rule

RFC-003 (Domain) may only list knobs that are **accepted** as user-adjustable here.  
RFC-005 (Request) mirrors this table — no new knobs without new assumption ID.

---

## Maintainer checklist

- [ ] Classify each `CalculationRequest` field: fixed | adjustable | forbidden
- [ ] Resolve multiplier (A1 vs A9)
- [ ] Resolve minimumBet (A4)
- [ ] Resolve profitMode (A5)
- [ ] Sign off before RFC-003 review

---

## References

- [RFC-001 Why](RFC-001-why-optimization.md)
- [RFC-003 Domain](RFC-003-domain.md)
- `src/application/dto/calculation-request.ts` (on `main`)
