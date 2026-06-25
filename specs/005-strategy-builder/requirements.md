# Spec 005 — Requirements

- [x] `buildStrategy(rounds: readonly Round[]): Strategy`
- [x] Canonical constructor for `Strategy` (ADR-034)
- [x] Ownership transfer — caller must not mutate `rounds` after build
- [x] **No statistics computation** (ADR-028)
- [x] **No derived values** — including `roundCount`
- [x] **No validation** of `CalculationRequest` or round math
- [x] No ConstraintSolver import

See `docs/CONTRACTS.md` Contract 6 and `docs/design/strategy-builder-spec.md`.
