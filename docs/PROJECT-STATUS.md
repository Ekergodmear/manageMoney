# Project Status

**Purpose:** Maintainer dashboard — current state at a glance.  
**Not** a technical spec. For depth, see `ROADMAP.md`, `CORE-STABILITY.md`, `API_FREEZE.md`.

**Last updated:** 2026-06-25

---

## Components

| Component          | Status           |
| ------------------ | ---------------- |
| Core SDK           | Stable           |
| Public API         | Frozen           |
| ValidationEngine   | Stable           |
| ConstraintSolver   | Production Ready |
| StrategyBuilder    | Stable           |
| StatisticsBuilder  | Stable           |
| SimulationEngine   | Stable           |
| OptimizationEngine | Planned          |
| UI                 | Planned          |

---

## Current version

```text
Core SDK: v1.0.0-rc.1
```

Tags: `core-sdk-v1-freeze`, `v1.0.0-rc.1`

---

## Next milestone

```text
Optimization — branch optimization-v1 (RFC in progress; not on main)
```

---

## Maintainer mindset (post–Core SDK v1)

- `main` = release line; Optimization on a separate branch.
- Core SDK is treated as a **published dependency** — even in the same repo.
- No new layers, ADRs, or workflows without a strong, documented reason.
- Core changes only with spec evidence (bug fix or spec gap).

**Sprint 3 review focus:**

| Criterion   | Question                                                 |
| ----------- | -------------------------------------------------------- |
| Correctness | Does the optimization algorithm match its specification? |
| Composition | Does it use the Core SDK Public API correctly?           |
| Isolation   | Is Optimization independent of Core internals?           |
| Performance | Does it meet expected complexity bounds?                 |

---

## Quick links

| Topic           | Document                                      |
| --------------- | --------------------------------------------- |
| Release steps   | `RELEASE_MANIFEST.md`                         |
| Module gates    | `docs/CORE-STABILITY.md`                      |
| Public contract | `API_FREEZE.md`, `PUBLIC_API.md`              |
| Sprint 3        | Branch `optimization-v1` only — not on `main` |
