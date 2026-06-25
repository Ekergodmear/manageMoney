# Core SDK — Stability Map

**Version:** Core SDK v1  
**Purpose:** Which modules are stable and what review is required to change them.  
**Audience:** Contributors and maintainers.

---

## Module status

| Module             | Status               | Gate                           |
| ------------------ | -------------------- | ------------------------------ |
| ValidationEngine   | **Stable**           | ADR-026                        |
| ConstraintSolver   | **Production Ready** | ADR-033 — design gate only     |
| StrategyBuilder    | **Stable**           | ADR-034                        |
| StatisticsBuilder  | **Stable**           | ADR-035                        |
| SimulationEngine   | **Stable**           | ADR-036                        |
| OptimizationEngine | Planned              | Sprint 3 — `optimization-v1`   |
| Application / UI   | Planned              | After Optimization (Sprint 3+) |

---

## Freeze policy — breaking review required

Core SDK v1 modules are **not experimentation zones**.

| Module            | Breaking review required |
| ----------------- | ------------------------ |
| ValidationEngine  | **Yes**                  |
| ConstraintSolver  | **Yes**                  |
| StrategyBuilder   | **Yes**                  |
| StatisticsBuilder | **Yes**                  |
| SimulationEngine  | **Yes**                  |

**Breaking** = contract change, behavior change on valid input, golden output change, public API change.

Process: design gate (ADR-032) + semver per `docs/COMPATIBILITY-POLICY.md`.  
Patch fixes restoring spec → PATCH bump + no gate skip.

---

## ADR usage (from Sprint 2.7)

| Use ADR for                       | Use CHANGELOG / design notes for |
| --------------------------------- | -------------------------------- |
| Breaking architecture             | New optional field               |
| Package split / public API policy | New helper (internal)            |
| Compatibility policy              | New tests, docs                  |

See ADR-037.

---

## Pipeline layers

```text
Construction          Observation           Decision
─────────────         ───────────           ────────
ValidationEngine      StatisticsBuilder     OptimizationEngine
ConstraintSolver      SimulationEngine
StrategyBuilder
```

---

## Public API (Sprint 2.7)

Supported import path:

```typescript
import { solve, buildStrategy, ... } from '@stake/constraint-engine';
```

Only exports from `src/public/index.ts` — see `PUBLIC_API.md` and `docs/design/public-api-inventory.md`.

Monorepo import: `@/public` or `@stake/constraint-engine` (tsconfig alias). Package rename to `@stake/constraint-engine` deferred until end of Sprint 2.7.

**API freeze:** `API_FREEZE.md` — no new v1 capabilities. Sprint 3 Optimization is a separate module.

---

## Canonical constructors

| Output               | Module                                  |
| -------------------- | --------------------------------------- |
| `Strategy`           | `StrategyBuilder.buildStrategy()`       |
| `StrategyStatistics` | `StatisticsBuilder.buildStatistics()`   |
| `SimulationResult`   | `SimulationEngine.simulateWinAtRound()` |

---

## Cross-module rules

- SimulationEngine: **Strategy only** — not `StrategyStatistics`
- OptimizationEngine: **must not** import SimulationEngine
- StatisticsBuilder: observational — never mutates `Strategy`
- Golden files: manual update — `docs/RELEASE-RULES.md`

---

## References

- `docs/COMPATIBILITY-POLICY.md`
- `docs/PERFORMANCE-CONTRACT.md`
- `docs/CONTRACTS.md`
- `DECISIONS.md`
