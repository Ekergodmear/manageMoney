# StrategyBuilder — Mapping Spec (Sprint 2.4)

**Status:** ✅ **FROZEN** — maintainer sign-off 2025-06-25  
**Authority:** ADR-034

---

## 1. Purpose

StrategyBuilder exists as an **architectural boundary**, not because of implementation complexity.

It is the **canonical aggregate constructor** for `Strategy` from raw round data.

```text
Round[]
      ↓
StrategyBuilder   ← only module allowed to construct Strategy from raw data
      ↓
Strategy
```

**Grandfathered exception:** `ConstraintSolver` (FROZEN, ADR-033) returns algorithm output shaped as `{ rounds }`. Application **must** pass `solve(...).value.rounds` through `buildStrategy()` before downstream use.

No other module may `return { rounds }` as a `Strategy`.

---

## 2. Immutable aggregate

Builder assembles an immutable `Strategy` aggregate:

- Caller must not mutate `rounds` after `buildStrategy(rounds)` — **ownership transfers** to `Strategy`.
- No clone required today; implementation may add `Object.freeze` in dev later without API change.
- Future `Strategy` invariants are enforced here as the model grows.

---

## 3. API

```typescript
function buildStrategy(rounds: readonly Round[]): Strategy;
```

|        |                                                 |
| ------ | ----------------------------------------------- |
| Errors | None — no `Result`, no `BuildError`             |
| Style  | Pure function — no class, factory, or interface |

---

## 4. Contracts (two layers)

| Contract     | Empty `rounds`                                       |
| ------------ | ---------------------------------------------------- |
| **Pipeline** | Never — `roundCount ≥ 1` via ValidationEngine        |
| **Builder**  | Valid — `buildStrategy([])` returns `{ rounds: [] }` |

Builder does not know ValidationEngine.

---

## 5. Forbidden — no derived information

StrategyBuilder **must never derive information**, including:

```text
maximumBet
requiredBankroll
averageBet
roundCount        ← even rounds.length is forbidden
roi
```

`Strategy` is a pure aggregate. All derived data → `StatisticsBuilder` (Sprint 2.5).

---

## 6. Out of scope

- Statistics, validation, optimization, simulation, formatting, sort, numeric normalization
- `StrategyResult`, `StrategyMetadata`, `StrategyStatistics`
- Unnecessary clone / deep copy / useless allocation

---

## 7. Import boundary

**May import:** `@/core/models`

**Must not import:** ConstraintSolver, ValidationEngine, StatisticsBuilder, Simulation, Optimization, Application

---

## 8. Tests

| ID  | Test                                                         |
| --- | ------------------------------------------------------------ |
| T1  | Empty rounds (builder contract)                              |
| T2  | One round                                                    |
| T3  | 50 rounds                                                    |
| T4  | Order preserved                                              |
| T5  | Input immutability                                           |
| T6  | No statistics / derived fields                               |
| T7  | Golden: `Round[]` → `Strategy` only (no solver in unit test) |

Fixtures: `tests/fixtures/strategy-builder/*.golden.json`

---

## 9. Implementation

```typescript
export function buildStrategy(rounds: readonly Round[]): Strategy {
  return { rounds };
}
```

Path: `src/core/strategy-builder/`

---

## References

- ADR-020, ADR-028, ADR-033, ADR-034
- `docs/CONTRACTS.md` Contract 6
