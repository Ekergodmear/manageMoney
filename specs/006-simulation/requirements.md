# Spec 006 — Requirements

- [x] `simulateWinAtRound(strategy, winAtRound): Result<SimulationResult, SimulationError>`
- [x] Deterministic scenario — no randomness
- [x] Strategy only — no StrategyStatistics
- [x] RoundSimulation projection — not full Round copy
- [x] Exactly one Win invariant
- [x] winningRoundIndex on output (self-contained)
- [x] Optimization must not import simulation

See ADR-036, `docs/design/simulation-engine-spec.md`.
