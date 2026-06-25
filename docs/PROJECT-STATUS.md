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
| OptimizationEngine | Sprint 3.2C.1 ✅ — 3.2C.2 next           |
| UI                 | Planned                                   |

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
| 3.2C.2 | Planned     | Round reduction (independent unit)           |
| 3.3    | Planned     | Full Optimization verification               |

Invariants: `docs/rfc/optimization/OPTIMIZATION-INVARIANTS.md`  
Next spec: `docs/design/sprint-3.2-spec.md`

---

## Branch policy

- `main` = Core SDK release line
- `optimization-v1` = Optimization RFC + implementation

---

## Quick links

| Topic       | Document                                           |
| ----------- | -------------------------------------------------- |
| Invariants  | `docs/rfc/optimization/OPTIMIZATION-INVARIANTS.md` |
| Sprint 3.2  | `docs/design/sprint-3.2-spec.md`                   |
| RFC index   | `docs/rfc/README.md`                               |
| Sprint gate | `docs/design/sprint-3-gate.md`                     |
