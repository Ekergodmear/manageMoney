# SDK Hardening — Plan (Sprint 2.7)

**Status:** IN PROGRESS — Core SDK v1 frozen  
**Mindset:** Library maintenance, not greenfield engine work.

Core SDK v1 modules (all stable):

- ValidationEngine
- ConstraintSolver
- StrategyBuilder
- StatisticsBuilder
- SimulationEngine

---

## 1. Priority order

| #   | Deliverable              | Why                                        |
| --- | ------------------------ | ------------------------------------------ |
| 1   | **Public API audit**     | Single entry — more important than Typedoc |
| 2   | **Compatibility policy** | SemVer with meaning                        |
| 3   | **Package layout**       | Publishable `constraint-engine`            |
| 4   | **Performance contract** | Complexity baseline + benchmarks           |
| 5   | **Compat tests**         | API surface regression                     |
| 6   | **Typedoc**              | Documents audited API only                 |

---

## 2. Public API audit

### Rule

```text
public/index.ts  →  the ONLY supported import path
```

Consumers:

```typescript
import {
  validateCalculationRequest,
  solve,
  buildStrategy,
  buildStatistics,
  simulateWinAtRound,
} from '@stake/constraint-engine';
```

**Forbidden** for external consumers:

```typescript
import { ceilDiv } from '@/core/solver/integer-math'; // implementation detail
```

### Audit checklist

- [x] Public Surface Inventory — `docs/design/public-api-inventory.md` (2.7A PROPOSED)
- [x] Public API spec — `docs/design/public-api-spec.md` (2.7A PROPOSED)
- [x] Maintainer sign-off 2.7A
- [x] Create `src/public/exports.ts` + `index.ts` (2.7B)
- [x] `package.json` exports + compat/architecture tests
- [x] `PUBLIC_API.md`
- [ ] Export domain types needed by consumers (`Strategy`, `Round`, `StrategyStatistics`, `SimulationResult`, DTOs, `Result`)
- [ ] Do **not** export: `integer-math`, internal helpers, test utilities
- [ ] Architecture test: no deep imports from `@/core/*` paths outside `src/` (consumers)
- [ ] `package.json` `exports` field maps `.` → public entry only
- [ ] Document in `docs/API.md` — public surface only

### Internal vs public

| Internal                          | Public                         |
| --------------------------------- | ------------------------------ |
| `src/core/solver/integer-math.ts` | `solve()`                      |
| `src/core/validation/rules/*`     | `validateCalculationRequest()` |
| Barrel `src/core/**/index.ts`     | Curated `public/index.ts`      |

---

## 3. Compatibility policy

See `docs/COMPATIBILITY-POLICY.md`.

| Bump      | When                                                               |
| --------- | ------------------------------------------------------------------ |
| **MAJOR** | Contract change, behavior change, intentional golden output change |
| **MINOR** | New API, new optional field                                        |
| **PATCH** | Optimization, bug fix, docs, tests                                 |

Golden changes → MAJOR or documented exception with maintainer approval.

---

## 4. ADR policy (from 2.7)

**ADR only for:**

- Breaking architectural decisions
- Package split / publish layout
- Compatibility policy
- Public API policy

**Not ADR:** new field, helper, test, doc fix → `CHANGELOG` or design notes.

See ADR-037.

---

## 5. Performance contract

See `docs/PERFORMANCE-CONTRACT.md`.

| Module            | Complexity | Notes          |
| ----------------- | ---------- | -------------- |
| ValidationEngine  | O(rules)   | Fixed rule set |
| ConstraintSolver  | O(N)       | N = roundCount |
| StrategyBuilder   | O(1)       | Aggregate wrap |
| StatisticsBuilder | O(N)       | Single pass    |
| SimulationEngine  | O(N)       | Single pass    |

Benchmarks in `benchmarks/` — CI optional threshold checks in 2.7.

---

## 6. Freeze policy

See `docs/CORE-STABILITY.md` — **breaking review required** for all Core SDK v1 modules.

---

## 7. Package identity

- Package name: `constraint-engine` (ADR-030)
- Scope TBD: `@stake/constraint-engine` vs unscoped — decide in 2.7
- `private: true` removed when publish ready
- `engines.node >= 22`

---

## 8. Deliverables checklist

### 2.7A / 2.7B (done)

- [x] `src/public/index.ts` + `exports.ts`
- [x] `docs/COMPATIBILITY-POLICY.md`
- [x] `docs/PERFORMANCE-CONTRACT.md` (structure — baselines pending 2.7C.2)
- [x] `docs/CORE-STABILITY.md`
- [x] Architecture + compat tests
- [x] `PUBLIC_API.md`, `API_FREEZE.md`

### 2.7C (in progress)

See `docs/design/sprint-2.7c-spec.md`:

- [ ] 2.7C.1 — README, LICENSE, CONTRIBUTING
- [ ] 2.7C.2 — Benchmark baseline
- [ ] 2.7C.3 — Packaging + `npm pack`
- [ ] 2.7C.4 — `v1.0.0-rc.1` → `v1.0.0`
- [ ] Tag `core-sdk-v1-freeze`
- [ ] Typedoc (public exports only) — optional before or with RC
- [ ] CHANGELOG: Core SDK v1.0.0-rc

---

## References

- ADR-030, ADR-037
- `docs/CORE-STABILITY.md`
- `ROADMAP.md` Sprint 2.7
