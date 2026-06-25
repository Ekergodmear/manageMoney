# Project Status

**Purpose:** Maintainer dashboard — current state at a glance.  
**Branch:** `optimization-v1`

**Last updated:** 2026-06-25

---

## Components

| Component          | Status                                    |
| ------------------ | ----------------------------------------- |
| Core SDK (`main`)  | Stable — `v1.0.0-rc.1`                    |
| Public API         | Frozen on `main` — no Optimization export |
| OptimizationEngine | **Production Ready** — internal module (Sprint 3.3 ✅) |
| Stake Planner Web  | **Next** — after Optimization freeze                 |

---

## RFC stack

All accepted — `docs/rfc/README.md`

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

Invariants: `docs/rfc/optimization/OPTIMIZATION-INVARIANTS.md`  
Verification: `docs/design/optimization-formal-verification.md`  
**Next:** Stake Planner Web (React)

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
| Sprint 3.3       | `docs/design/sprint-3.3-formal-verification.md`  |
| RFC index        | `docs/rfc/README.md`                               |
