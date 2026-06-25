# Spec 004 — Constraint Solver

**Sprint:** 2.3

Pure math in `src/core/solver/`.

**Prerequisite:** ValidationEngine FROZEN + approved math spec v2.0.0

**Review standard:** Algorithm paper — `docs/design/constraint-solver-algorithm.md`

**No TypeScript until design gate 2.3A–D approved:**

```text
2.3A  Problem Definition
2.3B  Pseudo-code
2.3C  State Machine
2.3D  Constructive Proof
2.3E  TypeScript
2.3F  Formal Verification
```

**No plugin layer in 2.3** — single solver. Extract plugins in Sprint 4.

**Returns `Strategy` only** — not `StrategyResult` (ADR-028).
