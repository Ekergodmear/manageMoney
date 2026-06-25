# Algorithm Design Process

**Applies to:** Sprint 2.3 (ConstraintSolver) and Sprint 3 (OptimizationEngine)

**Rule:** No TypeScript until pseudo-code, flowchart, and test cases are approved.

---

## Sprint 2.3 — ConstraintSolver

```
1. Pseudo-code     →  docs/design/solver-pseudocode.md
2. Flowchart       →  docs/design/solver-flowchart.md
3. Test cases      →  extend test-cases.md / fixtures
4. [User approve]
5. TypeScript      →  src/core/solver/ + src/core/algorithms/
```

**Scope:** Math only. No Strategy building. No UI types.

---

## Sprint 2.4 — StrategyBuilder

After Solver approved and implemented:

```
1. Mapping spec    →  docs/design/strategy-builder-spec.md
2. [User approve]
3. TypeScript      →  src/core/strategy-builder/
```

Maps `SolverOutput` → `Strategy` domain model.

---

## Sprint 3 — OptimizationEngine

```
1. Mathematical proof  →  docs/Mathematical-Proof.md
2. Pseudo-code         →  docs/design/optimization-pseudocode.md
3. [User approve]
4. TypeScript          →  src/core/optimization/
```

**Must use ConstraintSolver — must NOT import SimulationEngine.**

---

## Review Criteria

- [ ] Logic maps 1:1 to approved pseudo-code
- [ ] Returns `Result<T,E>` — no throw
- [ ] Uses domain models — no raw literals
- [ ] All fixtures pass exactly

---

_Plugin algorithms implement `StrategyAlgorithm` — one file per mode._
