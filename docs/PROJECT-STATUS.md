# Project Status

**Purpose:** Maintainer dashboard — current state at a glance.  
**Not** a technical spec. For depth, see `ROADMAP.md`, `CORE-STABILITY.md`, `API_FREEZE.md`.

**Last updated:** 2025-06-25

---

## Components

| Component          | Status             |
| ------------------ | ------------------ |
| Core SDK           | Stable             |
| Public API         | Frozen             |
| ValidationEngine   | Stable             |
| ConstraintSolver   | Production Ready   |
| StrategyBuilder    | Stable             |
| StatisticsBuilder  | Stable             |
| SimulationEngine   | Stable             |
| OptimizationEngine | Planned            |
| UI                 | Planned            |

---

## Current version

```text
Core SDK: v1.0.0-rc.1   (target after release — see RELEASE_MANIFEST.md)
```

Package version bumps on release commit B. Until then, `package.json` may still show a pre-RC version.

---

## Next milestone

```text
Sprint 3 — OptimizationEngine
```

**Branch:** `optimization-v1` (after RC tags on `main`)  
**Gate:** `docs/design/sprint-3-gate.md`

---

## Maintainer mindset (post–Core SDK v1)

- `main` = release line; Optimization on a separate branch.
- Core SDK is treated as a **published dependency** — even in the same repo.
- No new layers, ADRs, or workflows without a strong, documented reason.
- Core changes only with spec evidence (bug fix or spec gap).

**Sprint 3 review focus:**

| Criterion      | Question |
| -------------- | -------- |
| Correctness    | Does the optimization algorithm match its specification? |
| Composition    | Does it use the Core SDK Public API correctly? |
| Isolation      | Is Optimization independent of Core internals? |
| Performance    | Does it meet expected complexity bounds? |

---

## Quick links

| Topic | Document |
| ----- | -------- |
| Release steps | `RELEASE_MANIFEST.md` |
| Module gates | `docs/CORE-STABILITY.md` |
| Public contract | `API_FREEZE.md`, `PUBLIC_API.md` |
| Sprint 3 | `docs/design/sprint-3-gate.md`, `specs/007-optimization/` |
