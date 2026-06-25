# Stake Planner — Roadmap

**Product:** Stake Planner  
**Platform:** `@stake/constraint-engine` (stable)  
**Last updated:** 2026-06-25

---

## Product features

Each feature answers: *What does the user want?* *What gets worse if we skip it?*

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
Stake Planner v1.0.0
```

---

### Feature 1 — Generate Plan

**Goal:** User has a plan.

Enter reward multiplier, rounds, bets, target profit → see required bankroll and round-by-round bets.

**Success:** < 30 seconds, no documentation required.

**Platform:** `validateCalculationRequest` → `solve` → `buildStrategy` → `buildStatistics`

---

### Feature 2 — Improve Plan

**Goal:** When bankroll is not enough, user still gets a feasible option.

**Success:** User understands a *suggested plan* exists and can accept it.

**Platform:** `optimize` + structured `explanation`

---

### Feature 3 — Understand Plan

**Goal:** User trusts the plan.

Simulation + explanation — user knows *why* this plan fits their situation.

**Success:** User proceeds with confidence, not blind acceptance.

**Platform:** `simulateWinAtRound` + UI narrative from `explanation`

---

### Feature 4 — Keep Plan

**Goal:** User can save or share the plan.

**Success:** Export is useful outside the session.

**Platform:** Serialize public types (app-owned schema)

---

### Feature 5 — Trust Plan

**Goal:** Product feels polished and reliable.

Loading states, microcopy, animation, confidence cues.

**Success:** First-time user completes the full journey without friction.

---

## Delivery sequence

```text
Product Reset (docs)     ✅
    ↓
stake-planner CLI        dogfooding — generate | optimize
    ↓
Stake Planner UI         Features 1 → 5
    ↓
v1.0.0
```

CLI is a **dogfooding tool**, not a product. Two commands, plain output, then move to UI.

---

## Platform (complete)

`@stake/constraint-engine` — no feature roadmap here.

| Milestone | Status |
| --------- | ------ |
| Core SDK v1 + public API | ✅ `v1.0.0-rc.1` |
| Optimization engine + export | ✅ Production ready |
| Consumer validation + cookbook | ✅ Sprint 3 complete |

Platform changes: SemVer, [`PUBLIC_API.md`](PUBLIC_API.md), [`docs/CORE-STABILITY.md`](docs/CORE-STABILITY.md).
