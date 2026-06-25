# Project Status

**Purpose:** Where the project stands — at a glance.  
**Branch:** `optimization-v1`  
**Last updated:** 2026-06-25

---

## Platform

| | |
| --- | --- |
| **Package** | `@stake/constraint-engine` |
| **Version** | `v1.0.0-rc.1` |
| **Status** | **Stable** — publishable, public API frozen |
| **Proof** | 380+ tests, property + differential verification, minimal consumer, cookbook |

Platform work is **complete**. Changes require SemVer and maintainer gate — see [`PUBLIC_API.md`](../PUBLIC_API.md).

---

## Product

| | |
| --- | --- |
| **Name** | Stake Planner |
| **Status** | **In development** |
| **Spec** | RFC-101 (problem), RFC-102 (journey) — [`docs/rfc/product/`](rfc/product/README.md) |
| **Next** | Product Reset ✅ → CLI dogfooding → Feature 1 (Generate Plan) |

---

## Current focus

**Feature 1 — Generate Plan** — [`docs/product/feature-1-generate-plan.md`](product/feature-1-generate-plan.md)

> User enters parameters and gets a plan with required bankroll.

Brief + wireframe ✅ · Implement next.

Success: complete in **< 30 seconds** without reading docs.

---

## Product roadmap

```text
Feature 1  Generate Plan
    ↓
Feature 2  Improve Plan
    ↓
Feature 3  Understand Plan
    ↓
Feature 4  Keep Plan
    ↓
Feature 5  Trust Plan
    ↓
v1.0.0
```

Full roadmap: [`ROADMAP.md`](../ROADMAP.md)

---

## Before product features

| Step | Status | Notes |
| ---- | ------ | ----- |
| Product Reset (docs identity) | ✅ Done | README, status, roadmap, contributing |
| `stake-planner` CLI (dogfooding) | Planned | `generate` + `optimize` — not a second product |
| React app shell | After CLI dogfood | Feature 1 in UI |

---

## Quick links

| Topic | Document |
| ----- | -------- |
| Product problem | [`rfc/product/RFC-101-user-problem.md`](rfc/product/RFC-101-user-problem.md) |
| User journey | [`rfc/product/RFC-102-user-journey.md`](rfc/product/RFC-102-user-journey.md) |
| SDK cookbook | [`cookbook/README.md`](cookbook/README.md) |
| Platform stability | [`CORE-STABILITY.md`](CORE-STABILITY.md) |
| Optimization RFCs | [`rfc/README.md`](rfc/README.md) |

---

## Branch policy

- `main` — Core SDK release line (`v1.0.0-rc.1`)
- `optimization-v1` — Optimization + Stake Planner product line
