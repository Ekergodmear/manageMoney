# Project Status

**Purpose:** Maintainer dashboard — current state at a glance.  
**Branch:** `optimization-v1` — Optimization RFC + Sprint 3 implementation

**Last updated:** 2026-06-25

---

## Components

| Component          | Status                                         |
| ------------------ | ---------------------------------------------- |
| Core SDK (`main`)  | Stable — `v1.0.0-rc.1`                         |
| Public API         | Frozen on `main`                               |
| OptimizationEngine | RFC ✅ complete — **implementation gate open** |
| UI                 | Planned                                        |

---

## RFC stack

| RFC     | Title              | Status      |
| ------- | ------------------ | ----------- |
| RFC-001 | Why Optimization   | ✅ Accepted |
| RFC-002 | Assumptions        | ✅ Accepted |
| RFC-003 | Domain             | ✅ Accepted |
| RFC-004 | Mathematical Model | ✅ Accepted |
| RFC-005 | Request & Result   | ✅ Accepted |

Index: `docs/rfc/README.md`

---

## Next milestone

```text
Sprint 3 — implement OptimizationEngine at src/core/optimization/
```

Specification → Implementation → module contract (not Core v1 public export).

---

## Branch policy

- `main` = Core SDK release line only
- `optimization-v1` = RFC + Optimization code
- RFCs stay on branch until maintainer decides merge policy

---

## Quick links

| Topic       | Document                       |
| ----------- | ------------------------------ |
| RFC process | `docs/rfc/README.md`           |
| Sprint gate | `docs/design/sprint-3-gate.md` |
| Core SDK    | `API_FREEZE.md` (on `main`)    |
