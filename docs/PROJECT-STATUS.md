# Project Status

**Purpose:** Maintainer dashboard — current state at a glance.  
**Branch:** `optimization-v1` — Optimization RFC development line.

**Last updated:** 2026-06-25

---

## Components (Core SDK — from `main`)

| Component          | Status                           |
| ------------------ | -------------------------------- |
| Core SDK           | Stable (`v1.0.0-rc.1` on `main`) |
| Public API         | Frozen                           |
| OptimizationEngine | RFC phase (this branch)          |
| UI                 | Planned                          |

---

## Current work

```text
Optimization RFC — design only, no code
```

| RFC     | Title              | Status |
| ------- | ------------------ | ------ |
| RFC-001 | Why Optimization   | Draft  |
| RFC-002 | Assumptions        | Draft  |
| RFC-003 | Domain             | Draft  |
| RFC-004 | Mathematical Model | Draft  |
| RFC-005 | Request & Result   | Draft  |

Index: `docs/rfc/README.md`

**Review order:** 001 → 002 → 003 → 004 → 005

---

## Branch policy

- `main` = Core SDK release line only
- `optimization-v1` = RFC + future Optimization code
- RFC drafts **not** merged to `main` until approved

---

## Quick links

| Topic           | Document                         |
| --------------- | -------------------------------- |
| RFC process     | `docs/rfc/README.md`             |
| Sprint gate     | `docs/design/sprint-3-gate.md`   |
| Core SDK (main) | `API_FREEZE.md`, `PUBLIC_API.md` |
