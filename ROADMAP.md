# Stake Planner — Roadmap

**Product:** Stake Planner (UI app)  
**Engine:** Calculation Engine SDK — future package `constraint-engine` (ADR-030)  
**Last Updated:** 2025-06-25  
**Current Sprint:** 2.7C — SDK Publish Candidate  
**Status dashboard:** `docs/PROJECT-STATUS.md`

---

## Sprint 2.7 — closed items

| Phase | Deliverable                          | Status |
| ----- | ------------------------------------ | ------ |
| 2.7A  | Public API audit (architect)         | ✅     |
| 2.7B  | `src/public/index.ts` + compat tests | ✅     |
| —     | `API_FREEZE.md`                      | ✅     |

---

## Sprint 2.7C — SDK Publish Candidate (current)

**Sequence:** `2.7C → v1.0.0-rc.1 → v1.0.0 → Sprint 3`

See `docs/design/sprint-2.7c-spec.md`.

| Phase      | Deliverable                         | Status      |
| ---------- | ----------------------------------- | ----------- |
| **2.7C.1** | README + LICENSE + CONTRIBUTING     | ✅          |
| **2.7C.2** | Benchmark baseline (public API)     | ✅          |
| **2.7C.3** | Packaging + `pnpm pack`             | ✅          |
| **2.7C.4** | `v1.0.0-rc.1` → tags + manifest     | ⏳          |
| —          | Tag `core-sdk-v1-freeze` (internal) | ⏳ end 2.7C |

**Sprint 3 gate:** See `docs/design/sprint-3-gate.md` — branch `optimization-v1`, SDK-client review.

---

## Sprint 2.7 (legacy table)

**Mindset:** Library maintenance — Core SDK v1 feature complete.

| Priority | Deliverable                 | Status |
| -------- | --------------------------- | ------ |
| 1        | Public API audit            | ✅     |
| 2        | API freeze                  | ✅     |
| 3        | Compatibility policy        | ✅     |
| 4        | Compat + architecture tests | ✅     |
| 5–7      | → moved to **2.7C** above   | ⏳     |

ADR-037: ADR discipline from 2.7 onward.

**Review focus:** Public API stability → backward compatibility → performance → SDK UX.

```text
core/           → publishable Calculation Engine SDK
application/    → orchestration layer
UI              → one consumer (late — after SDK hardening)
```

---

## Sprint Order

```text
2.1A  Models + contracts          ✅
2.1B  DTO (CalculationRequest)    ✅
2.1C  Mathematical Specification  ✅
2.2   ValidationEngine            ✅ FROZEN
2.3   ConstraintSolver            ✅ FROZEN — Production Ready
2.4   StrategyBuilder             ✅ FROZEN (ADR-034)
2.5   StatisticsBuilder           ✅ FROZEN (ADR-035)
2.6   SimulationEngine              ✅ FROZEN (ADR-036)
2.7   SDK Hardening                 ✅ (2.7A/B + API freeze)
2.7C  SDK Publish Candidate         ← current
3     OptimizationEngine (+ OptimizationRequest)
4     Plugin Architecture + mutation testing (Stryker)
5+    Application orchestration + UI
```

---

## Sprint 2.3 — ConstraintSolver (closed)

| Step     | Deliverable                                   | Status    |
| -------- | --------------------------------------------- | --------- |
| **2.3A** | Problem Definition                            | ✅ FROZEN |
| **2.3B** | Pseudo-code                                   | ✅ FROZEN |
| **2.3C** | State Machine                                 | ✅ FROZEN |
| **2.3D** | Constructive Proof                            | ✅ FROZEN |
| **2.3E** | TypeScript implementation                     | ✅ FROZEN |
| **2.3F** | Formal Verification (property + differential) | ✅ FROZEN |

---

## Sprint 2.7 — SDK Hardening (closed)

**Mindset:** Library maintenance — Core SDK v1 feature complete.

| Priority | Deliverable                                               | Status         |
| -------- | --------------------------------------------------------- | -------------- |
| 1        | **Public API audit** — `src/public/index.ts`              | ✅ 2.7A / 2.7B |
| 2        | **API freeze** — `API_FREEZE.md`                          | ✅             |
| 3        | **Compatibility policy** — `docs/COMPATIBILITY-POLICY.md` | ✅             |
| 4        | Compat + architecture tests                               | ✅             |

**Continued in Sprint 2.7C** — see `docs/design/sprint-2.7c-spec.md`.

ADR-037: ADR discipline from 2.7 onward.

**Review focus (post-2.7B):** Public API stability → backward compatibility → performance → SDK UX.

---

## Architecture (frozen through v1.0.0)

```text
ValidationEngine          ✅ Stable
      ↓
ConstraintSolver          ✅ Production Ready
      ↓
StrategyBuilder           ✅ FROZEN (ADR-034)
      ↓
StatisticsBuilder         ✅ FROZEN (ADR-035)
      ↓
Application               (→ StrategyResult)
      ↓
SimulationEngine          ✅ FROZEN (ADR-036) — Strategy only
      ↓
OptimizationEngine        Sprint 3
```

---

## Review focus by layer

| Layer             | Review focus                               |
| ----------------- | ------------------------------------------ |
| ConstraintSolver  | Closed — spec changes only via design gate |
| StrategyBuilder   | Closed — ADR-034                           |
| StatisticsBuilder | Closed — ADR-035                           |
| SimulationEngine  | Deterministic interpreter; Strategy only   |
| SDK Hardening     | Public API, packaging, SemVer, docs        |

### Layer groups

```text
Construction:  Validation → Solver → StrategyBuilder
Observation:   StatisticsBuilder, SimulationEngine
Decision:      OptimizationEngine
```

Post-2.6: `docs/CORE-STABILITY.md` — module stability map.

---

## Done Gate

Core modules are **production-ready** when specification, tests, and public contract are frozen — not when UI exists.
