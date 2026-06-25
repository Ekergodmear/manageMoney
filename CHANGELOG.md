# Changelog

All notable changes to Stake Planner are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] - 2025-06-25 — Sprint 1

### Added

- Project foundation: pnpm, TypeScript strict, Vite, Vitest, ESLint, Prettier
- Path aliases via tsconfig + vite-tsconfig-paths (ADR-025)
- Architecture tests + alias resolution tests
- Minimal React shell (`index.html`, `App.tsx`, `main.tsx` — no StrictMode, no CSS)
- `.vscode/` settings, `.github/workflows/ci.yml`
- `tests/smoke/` for test-only utilities

### Changed

-

### Fixed

-

### Removed

- Test-purpose files from `src/core/`

---

## [1.0.0-rc.1] - 2026-06-25 — Core SDK Release Candidate

### Added

- Public API (`@stake/constraint-engine`) — 5 capabilities + `ValidationCodes`
- Packaging: `dist/index.js`, consumer smoke, deep-import rejection
- `RELEASE_MANIFEST.md`, `API_FREEZE.md`, `PUBLIC_API.md`
- Performance contract + benchmark baseline (schema v2)
- Typedoc — `src/public/index.ts` only (`pnpm docs:api`)

### Changed

- Package name: `@stake/constraint-engine`
- `build:lib` (SDK) separated from `build:app` (UI)

---

## [Unreleased]

### Added

- **Core SDK v1** — Validation, Solver, StrategyBuilder, StatisticsBuilder, SimulationEngine (all stable)
- SimulationEngine FROZEN (ADR-036) — deterministic scenario interpreter
- `docs/CORE-STABILITY.md` — stability map + freeze policy
- Sprint 2.7 plan: `docs/design/sdk-hardening-spec.md`, ADR-037
- `docs/COMPATIBILITY-POLICY.md`, `docs/PERFORMANCE-CONTRACT.md`
- Property tests P1–P8 (`fast-check`), differential oracle (greedy vs brute-force)
- `pnpm test:property` (10 000 runs), `pnpm test:property:stress` (50 000 runs)
- `docs/RELEASE-RULES.md` — golden manual update + no property retry
- `.github/workflows/nightly.yml` — scheduled property profile
- Sprint 2.7 SDK Hardening on roadmap (after StatisticsBuilder)
- Algorithm paper: `docs/design/constraint-solver-algorithm.md` (Sprint 2.3 design gate)
- State machine doc: `docs/design/constraint-solver-state-machine.md`
- Spec 006 StatisticsBuilder — derived metrics split from StrategyBuilder
- ADR-028 — StatisticsBuilder separate from StrategyBuilder
- ADR-029 — Algorithm paper design gate (2.3A–2.3F)
- ADR-030 — SDK identity; project rename proposed (Stake Engine)
- ValidationEngine **FROZEN** — ADR-026 (Stable API, immutable error codes, domain-only `ValidationResult`)
- ADR-027 — ConstraintSolver trust boundary (no re-validation)
- ValidationEngine: `validateCalculationRequest()` with three-phase pipeline
- Error codes S### / B### / M###, `ValidationResult.errorCount` / `warningCount`
- `pnpm test:validation:coverage` — 100% branch coverage gate on validation module

### Changed

- ConstraintSolver specification, algorithm, implementation **FROZEN** (2.3A–F)
- README: pipeline diagram + ConstraintSolver status table
- Current sprint: **2.4 StrategyBuilder**
- Algorithm paper §1–§4 **APPROVED** (2.3A): PrimaryConstraint, domain D, A6/A7, monotonicity proof, RequiredBankrollAmount
- ADR-030 amended — reject Stake Engine; future core package `constraint-engine`
- ADR-031 — solver hot path: explicit `for` only; no map/reduce/forEach
- `docs/SOLVER-CODING-RULES.md` added
- Math spec + DOMAIN-LANGUAGE v1.3.0: percentage = % of AccumulatedSpentBeforeRound; Round.accumulatedSpent = after round
- Pseudo-code **FROZEN** (2.3B — 2025-06-25)
- State machine **FROZEN** (2.3C); total function + no hidden state + preserves I1–I8
- Global optimality blocker resolved — Lemma 1 (monotone MFB) + induction (§9)
- `constraint-solver-implementation-checklist.md` — 2.3E gate
- Formal verification plan (2.3F): `constraint-solver-formal-verification.md`
- Spec drives implementation rule in `SOLVER-CODING-RULES.md`
- Sprint 2.3 restructured: 6-step design gate (2.3A–2.3F)
- Math spec: assumption A6 (discrete bets); pipeline includes StatisticsBuilder
- `docs/FLOWS.md` rev. 2.0 — full pipeline with StatisticsBuilder
- ROADMAP: SDK identity; Simulation → Sprint 2.6; StatisticsBuilder → 2.5
- StrategyBuilder scope: transform only — statistics moved to StatisticsBuilder (ADR-028)
- `ValidationError` shape: `code`, `message`, `path`, `layer`
- Validation failure returns `ValidationResult` (not bare errors)
- Success returns `ValidatedCalculationRequest` without mutating input
- `docs/DOMAIN-LANGUAGE.md` v1.2.0 — models vs contracts, barrel rules, branded type roadmap
- `Result` / `ValidationResult` / `StrategyResult` moved to `src/core/contracts/`
- Removed `isSuccess()` / `isFailure()` — use `result.kind === 'success'`
- `StrategyStatistics.roundCount` added
- `StrategyMetadata` locked (`generatedAt`, `algorithm`, `version`)
- `StrategyInput` DTO path: `src/application/dto/` (Sprint 2.1B)

## [0.0.1] - 2025-06-25 — Sprint 0 / 0.5

### Added

- `.memory-bank/` — project memory (project, architecture, rules, algorithms)
- `domain.md`, `session-start.md`, `review-checklist.md`, `done-definition.md`
- Cursor Rules: `00-session.mdc`, `01-review-agent.mdc`
- `docs/PRD.md`, `docs/API.md`, `docs/CURSOR-WORKFLOW.md`
- `DECISIONS.md`, `ROADMAP.md`
- Folder structure: `src/core`, `src/app`, `src/ui`

### Changed

-

### Fixed

-

### Removed

-
