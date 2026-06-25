# Project Status

**Purpose:** Maintainer dashboard — current state at a glance.  
**Branch:** `optimization-v1`

**Last updated:** 2026-06-25  
**Phase:** Consumer Validation (Sprint 3.6) — Product Technical Lead

---

## Components

| Component          | Status                                    |
| ------------------ | ----------------------------------------- |
| Core SDK (`main`)  | Stable — `v1.0.0-rc.1`                    |
| Public API         | Core + **Optimization export** (Sprint 3.6) |
| OptimizationEngine | **Production Ready** — exported via public API (Sprint 3.3 ✅) |
| Stake Planner      | RFC ✅ — **Consumer Validation** → Demo CLI |

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

**Next:** Demo CLI (`generate` + `optimize`) → Sprint 4 Product

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
| Product index    | `docs/rfc/product/README.md`                     |
| RFC index        | `docs/rfc/README.md`                               |
