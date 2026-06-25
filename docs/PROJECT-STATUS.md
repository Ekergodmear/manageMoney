# Project Status

**Purpose:** Maintainer dashboard — current state at a glance.  
**Branch:** `optimization-v1`

**Last updated:** 2026-06-25  
**Phase:** **Sprint 3 complete** — Demo CLI (dogfooding) next

---

## Sprint 3 — closed

Engine → SDK platform: RFC, Public API, property/differential tests, minimal consumer, cookbook, DX, product readiness sign-off.

**SDK role is complete.** Further work is product (CLI dogfooding → React).

---

## Components

| Component          | Status                                    |
| ------------------ | ----------------------------------------- |
| Core SDK (`main`)  | Stable — `v1.0.0-rc.1`                    |
| Public API         | Core + Optimization — consumer-validated  |
| OptimizationEngine | **Production Ready** — exported (Sprint 3.3 ✅) |
| Stake Planner      | RFC ✅ — **Demo CLI** (dogfooding) → React |

---

## RFC stack

| Stack | Status |
| ----- | ------ |
| Optimization RFC-001–005 | ✅ Accepted |
| Product RFC-101 | ✅ Accepted — `docs/rfc/product/` |
| Product RFC-102 | ✅ Accepted — User Journey |

---

## Implementation

| Sprint | Status      | Deliverable                                 |
| ------ | ----------- | ------------------------------------------- |
| 3.1A   | ✅ Approved | Contracts + 10 unit tests                   |
| 3.1B   | ✅ Approved | `optimize()` identity + 7 tests + arch test |
| 3.2A   | ✅ Approved | `SearchPolicy` + invariant tests            |
| 3.2B   | ✅ Done     | Profit search + First Feasible Wins (frozen) |
| 3.2C.1 | ✅ Done     | Monotonic Budget + Prefix Stability (frozen) |
| 3.2C.2 | ✅ Done     | Round reduction + nested prefix (frozen)     |
| 3.3    | ✅ Frozen   | Formal verification — Production Ready         |
| 3.5    | ✅ Done     | RFC-101 + RFC-102 product spec (no code)       |
| 3.6    | ✅ Done     | `examples/minimal-consumer` + arch isolation test |
| 3.7    | ✅ Signed off | Product Readiness Review — platform complete      |
| 3.7 DX | ✅ Done     | Cookbook + error mapping + README sequence diagram |

**Sprint 3:** ✅ **Complete**

---

## Roadmap (product)

```text
Demo CLI (stake generate | stake optimize)
  ↓
Internal dogfooding — use SDK as a real user
  ↓
Sprint 4 — React (PM lens)
  4.1 App Shell → 4.2 Generate → 4.3 Optimization UX
  → 4.4 Simulation → 4.5 Export → 4.6 Polish
```

**Next:** Demo CLI — two commands only, no TUI/interactive

---

## Branch policy

- `main` = Core SDK release line
- `optimization-v1` = Optimization RFC + implementation

---

## Quick links

| Topic            | Document                                           |
| ---------------- | -------------------------------------------------- |
| Invariants       | `docs/rfc/optimization/OPTIMIZATION-INVARIANTS.md` |
| Formal verify    | `docs/design/optimization-formal-verification.md`  |
| Product RFC-101  | `docs/rfc/product/RFC-101-user-problem.md`       |
| Product RFC-102  | `docs/rfc/product/RFC-102-user-journey.md`       |
| SDK Cookbook     | `docs/cookbook/README.md`                        |
| Product Readiness| `docs/design/sprint-3.7-product-readiness.md`  |
| Product index    | `docs/rfc/product/README.md`                     |
| RFC index        | `docs/rfc/README.md`                               |
