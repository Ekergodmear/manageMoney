# Game Policy Brief

**Package:** `@stake/constraint-engine` (Platform) · **Product:** Stake Planner presets  
**Lane:** Platform (parallel to Feature 1 #018 — **does not block usability test**)  
**Status:** **Approved** — architecture sign-off 2026-06-25  
**Scope:** Core SDK abstraction — affects validation, solver, optimization, simulation paths

---

## 1. Goal

Stake Planner helps users plan bets under the **rules of a specific game environment**.

Platform must **not** accumulate game-specific rules inside ConstraintSolver (`maximumBet`, tax tiers, flat fees, … as hardcoded branches).

Pipeline:

```text
GamePolicy
    ↓
Policy Translator
    ↓
SolverConstraints
    ↓
Validation
    ↓
Constraint Solver
    ↓
Statistics
```

**Product** maps user-facing presets to policies:

```text
"Crash ×20"  →  GamePolicy preset
"Casino A"   →  GamePolicy preset
```

**Solver never knows `GamePolicy` exists.** It only receives a frozen **`ValidatedPlanningInput`** whose constraints are already normalized.

**Public contract (high level):**

> Planning respects a **game policy**: bet lattice constraints and a **reward policy** that defines net reward per bet.

Preset labels, multi-account guidance, and ToS copy are **Product** — not Core API surface.

### Platform architecture

```text
Game
    │
    ▼
GamePolicy                    ← rich game model (may grow: VIP, timezone, daily caps, …)
    │
    ▼
Policy Translator             ← GamePolicy → SolverConstraints
    │
    ▼
SolverConstraints             ← minimumBet, maximumBet, betStep, RewardPolicy
    │
    ▼
Validation
    │
    ▼
Constraint Solver
    │
    ▼
Optimization
   ├──────────────┐
   ▼              ▼
Stake Planner   Allocation Planner   (Distribute Plan — beside Optimization, not in solver)
```

---

## 2. Model

### 2.1 GamePolicy

Rich **game environment** model — owned by Product presets, may grow without touching solver.

```ts
interface GamePolicy {
  readonly minimumBet: number;
  readonly maximumBet: number;
  readonly betStep: number;
  readonly reward: RewardPolicy;
  // future: dailyCap, vipLevel, timezone, currency, …
}
```

| Field        | Meaning                        |
| ------------ | ------------------------------ |
| `minimumBet` | Floor bet per round            |
| `maximumBet` | Environment cap                |
| `betStep`    | Bet lattice increment          |
| `reward`     | Immutable reward policy (§2.2) |

GamePolicy can become large. **Solver never imports this type.**

---

### 2.2 SolverConstraints

Minimal surface the **solver and validation** need — stable across games.

```ts
interface SolverConstraints {
  readonly minimumBet: number;
  readonly maximumBet: number;
  readonly betStep: number;
  readonly rewardPolicy: RewardPolicy;
}
```

| Concept             | Role                                         |
| ------------------- | -------------------------------------------- |
| `GamePolicy`        | What the game _is_ (Product / presets)       |
| `SolverConstraints` | What the solver _needs_ (normalized, frozen) |

When Game A becomes Game B with extra fields, only **Policy Translator** changes — not `solve()`.

---

### 2.3 Policy Translator

Pure function — no side effects, no I/O.

```ts
function translatePolicyToConstraints(policy: GamePolicy): SolverConstraints;
```

**Examples:**

```text
Casino A GamePolicy  →  translate  →  SolverConstraints { min, max, step, rewardPolicy }
Casino B GamePolicy  →  translate  →  SolverConstraints { … }   // same solver
Crash ×20 preset     →  translate  →  SolverConstraints { … }
```

Translator may:

- Drop game-only fields (VIP, timezone) not needed for single-account planning today
- Derive effective `maximumBet` from nested rules
- Attach the correct `RewardPolicy` instance

Translator lives **outside** `src/core/solver/` — application or dedicated `policy-translator` module.

**Flow:**

```text
validatePlanning({ policy, calculation })
    → constraints = translatePolicyToConstraints(policy)
    → validate bundle { constraints, calculation }
    → ValidatedPlanningInput
```

---

### 2.4 RewardPolicy

Immutable **value object** — no mutation after construction.

```ts
interface RewardPolicy {
  readonly grossReward: (bet: number) => number;
  readonly netReward: (bet: number) => number;
}
```

**Immutability rules:**

- All config fields `readonly` at construction
- **No** `policy.taxRate = …` after validate
- Preset builders return frozen instances (`Object.freeze` at boundary optional)

**Why:** deterministic solver, simple property tests, optimization without side effects.

**Contract:** solver calls **`netReward(bet)` only** — not `netReward(grossReward(bet))` as the public interface.

| Approach           | Verdict                                  |
| ------------------ | ---------------------------------------- |
| `netReward(bet)`   | ✅ **Chosen** — solver stays bet-centric |
| `netReward(gross)` | ❌ Rejected as solver-facing API         |

Inside a tax implementation:

```text
netReward(bet) = applyDeductions(grossReward(bet))   // private to policy class
```

**Today (linear, no tax):**

```text
grossReward(b) = netReward(b) = scaledLinear(b, multiplier)
```

**Tomorrow (tier tax — policy impl, not solver):**

```text
grossReward(b) = bet × M
netReward(b)   = gross ≤ threshold ? gross : gross × (1 − rate)
```

---

### 2.5 Monotonicity contract

> For valid bets `b₁ < b₂` on the lattice: `netReward(b₁) ≤ netReward(b₂)`

Tested per **RewardPolicy** implementation. Solver proofs are parametric over monotonic policies.

---

### 2.6 Integer arithmetic

Same discipline as [arithmetic-migration-brief.md](./arithmetic-migration-brief.md) — no IEEE float in monetary paths.

---

## 3. Validation rules

Validation runs on **`{ constraints: SolverConstraints, calculation: CalculationRequest }`** — after translation.

### Environment — Validation owns (shape)

| Rule       | Layer                 | Check                                                         |
| ---------- | --------------------- | ------------------------------------------------------------- |
| Lattice    | structural / business | `minimumBet > 0`, `betStep > 0`, `minimumBet % betStep === 0` |
| Cap shape  | business              | `maximumBet ≥ minimumBet`, `maximumBet` on lattice            |
| Multiplier | structural            | ≤ 2 decimal places (on reward policy config)                  |
| Bundle     | structural            | `constraints` + `calculation` present and finite              |

### Feasibility — Solver owns

| Situation                          | Owner          | Outcome                                         |
| ---------------------------------- | -------------- | ----------------------------------------------- |
| `minimumBet > maximumBet`          | **Validation** | Reject — impossible environment                 |
| Round needs `b > maximumBet`       | **Solver**     | `NO_FEASIBLE_SOLUTION` / `MAXIMUM_BET_EXCEEDED` |
| No plan under constraints + target | **Solver**     | `NO_FEASIBLE_SOLUTION`                          |

**ADR-027:** Validation rejects ill-shaped input. Solver reports infeasibility. Validation does **not** simulate full round loop.

### Migration from today

```text
validateCalculationRequest(calculation)
    → defaultGamePolicyFromCalculation(calculation)
    → translatePolicyToConstraints(policy)
    → validate as today (regression preserved)
```

---

## 4. Solver impact

> **Solver does not know `GamePolicy` exists.**

It receives **`ValidatedPlanningInput`**:

```ts
interface ValidatedPlanningInput {
  readonly constraints: SolverConstraints;
  readonly calculation: CalculationRequest;
}
```

### What changes

| Area                 | Change                                                             |
| -------------------- | ------------------------------------------------------------------ |
| Input                | `ValidatedPlanningInput.constraints` — not `GamePolicy`            |
| Profit (I1)          | `constraints.rewardPolicy.netReward(bet) − accumulatedSpent`       |
| Round (I5)           | `rewardAmount = netReward(betAmount)`                              |
| Minimal feasible bet | Re-derived for non-linear policies; linear keeps current structure |
| Game names           | **Never** in solver                                                |

### What does not change

| Area           | Change                                |
| -------------- | ------------------------------------- |
| Trust boundary | Frozen validated input only (ADR-027) |
| Output         | `Strategy` / `Round` unchanged        |
| `optimize()`   | Same `ValidatedPlanningInput` context |
| Determinism    | Same validated input → same strategy  |

### Rollout

```text
Phase 1: Translator + SolverConstraints + linear RewardPolicy — byte-identical regression
Phase 2: maximumBet in constraints
Phase 3: TierTax RewardPolicy implementation
```

---

## 5. Verification plan

```text
1. Policy Translator + SolverConstraints + immutable RewardPolicy
      ↓
2. Regression M=20 byte-identical
      ↓
3. maximumBet + infeasibility errors
      ↓
4. Tier tax RewardPolicy + monotonic property tests
      ↓
5. Product presets — Lane Product
```

Architecture tests: `src/core/solver/**` must not import `GamePolicy` type.

---

## 6. Architecture decisions (review checklist)

### 6.1 Ownership

```text
App / Stake Planner
    → GamePolicy (preset)
    → CalculationRequest (user intent)
    ↓
validatePlanning({ policy, calculation })
    → translatePolicyToConstraints(policy)
    → validate { constraints, calculation }
    ↓
ValidatedPlanningInput
    ↓
solve(validated)          ← sees constraints only
    ↓
optimize / simulate / buildStatistics
```

**Rejected:** Solver imports `GamePolicy`.  
**Rejected:** Solver reads game name strings.

---

### 6.2 Default policy

| API                                         | Behavior                                       |
| ------------------------------------------- | ---------------------------------------------- |
| `validatePlanning({ policy, calculation })` | **Preferred** — explicit policy                |
| `validateCalculationRequest(calculation)`   | Legacy — default policy + translate internally |

Stake Planner always uses explicit policy. Legacy path for SDK consumers + regression.

---

### 6.3 Versioning

Additive evolution — extend `GamePolicy` / preset builders (minor). Breaking `RewardPolicy` interface → major. No `GamePolicyV2` big-bang.

---

### 6.4 RewardPolicy

| Method             | Caller                                   |
| ------------------ | ---------------------------------------- |
| `netReward(bet)`   | Solver, Optimization                     |
| `grossReward(bet)` | Product, Statistics (display / warnings) |

Immutable value object. No mutation after validate.

---

### 6.5 Constraint ownership

| Constraint                   | Validation | Solver |
| ---------------------------- | ---------- | ------ |
| Lattice shape, `max ≥ min`   | ✅         | —      |
| `bet ≤ maximumBet` per round | —          | ✅     |
| Plan exists                  | —          | ✅     |

---

### 6.6 Downstream impact

| Module                        | Impact                                                  |
| ----------------------------- | ------------------------------------------------------- |
| **Policy Translator**         | New — `GamePolicy` → `SolverConstraints`                |
| **Validation**                | `validatePlanning`; validates constraints + calculation |
| **Solver**                    | `ValidatedPlanningInput`; no `GamePolicy` import        |
| **Optimization / Simulation** | Same validated input                                    |
| **Product**                   | Presets build `GamePolicy`; call translator via SDK     |

---

## Review sign-off

- [x] §6.1 — `GamePolicy` vs `SolverConstraints`; solver never sees `GamePolicy`
- [x] §6.2 — Default policy / legacy path
- [x] §6.3 — Additive versioning
- [x] §6.4 — `netReward(bet)`; immutable `RewardPolicy`
- [x] §6.5 — Validation shape / Solver feasibility
- [x] §6.6 — Policy Translator layer
- [x] §6.6 — Downstream scope

**Approved** — ready for commit `docs(platform): introduce Game Policy architecture`  
**Date:** 2026-06-25

---

## Out of scope

| Topic                  | Where                            |
| ---------------------- | -------------------------------- |
| **Allocation Planner** | Distribute Plan — separate brief |
| Feature 1 #018         | Continues — independent lane     |
| Feature 2 Improve Plan | Unchanged scope                  |
| Animation / UI polish  | After Feature 2                  |

---

## Summary

| Do                                                  | Don't                            |
| --------------------------------------------------- | -------------------------------- |
| `GamePolicy` → **Translator** → `SolverConstraints` | Pass `GamePolicy` into `solve()` |
| Immutable `RewardPolicy`                            | Mutate policy after validate     |
| Solver parametric on constraints                    | Hardcode game rules in solver    |
| Keep **#018** running                               | Pause usability for Platform     |

**Next step:** Phase 1 implementation — Translator + SolverConstraints + regression only.
