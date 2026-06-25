# Spec 004 — Requirements

**Prerequisite:** ValidationEngine FROZEN (ADR-026) + algorithm paper approved

## Design gate (before TypeScript)

- [x] 2.3A — Problem Definition ✅
- [x] 2.3B — Pseudo-code ✅ FROZEN
- [x] 2.3C — State Machine ✅ FROZEN
- [ ] 2.3D — Constructive Proof (`constraint-solver-constructive-proof.md`)
- [ ] 2.3D — Manual Proof (X20, 50 rounds, 100k fixed profit)
- [ ] User approval each step

## Implementation (2.3E)

- [ ] `solve(validated): Result<Strategy, SolverError>` — pure function
- [ ] Returns **`Strategy` only** — not `StrategyResult`, not statistics
- [ ] Input: `ValidatedCalculationRequest` — **no re-validation** (ADR-027)
- [ ] State machine: sole state = `AccumulatedSpent`
- [ ] Assumptions A1–A6 (including discrete bets)
- [ ] Integer ceil-to-step — no float intermediates
- [ ] No StrategyBuilder / StatisticsBuilder logic

## Verification (2.3F)

- [ ] Fixture tests pass
- [ ] I1–I8 assertion suite
- [ ] Termination + correctness + optimality proofs tested
- [ ] Determinism tests

See `docs/design/constraint-solver-algorithm.md`, ADR-027, ADR-028, ADR-029.
