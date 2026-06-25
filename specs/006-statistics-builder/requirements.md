# Spec 006 — Requirements

- [x] `buildStatistics(strategy: Strategy): StrategyStatistics`
- [x] Canonical derived data calculator (ADR-035)
- [x] Observational only — never mutate `Strategy`
- [x] Formulas Strategy-only — no `CalculationRequest`
- [x] `requiredBankrollAmount` from `last.accumulatedSpent`
- [x] `expectedProfitAmount` — terminal profit, not cumulative
- [x] `averageBetAmount` — floor(Σ/N)
- [x] No solver / validation / strategy-builder imports

See ADR-035, Contract 6b, `docs/design/statistics-builder-spec.md`.
