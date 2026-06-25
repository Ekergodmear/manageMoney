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
| OptimizationEngine | Sprint 3.1 ✅ — Sprint 3.2 planned        |
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
| 3.2A   | Planned     | `SearchPolicy` spec + tests                 |
| 3.2B   | Planned     | Profit search only                          |
| 3.2C   | Planned     | Nested search (RFC-004)                     |

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
