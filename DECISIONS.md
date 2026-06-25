# Architecture Decision Records (ADR)

This document records **why** key decisions were made. AI agents and developers must read this before changing architecture, algorithms, or public APIs.

---

## ADR-001: Clean Architecture with Framework-Independent Core

**Status:** Accepted  
**Date:** 2025-06-25

### Context

The calculation engine must run in React (web), React Native (mobile), Node (scripts), and Vitest (tests) without modification.

### Decision

Place all business logic in `src/core`. UI components only render results. Application layer (hooks, forms) orchestrates but does not calculate.

### Consequences

- Core has zero React imports
- Easier to test (pure functions)
- Slightly more boilerplate (types, adapters)
- UI changes never risk breaking calculations

---

## ADR-002: Always Round Bet UP (Ceiling)

**Status:** Accepted  
**Date:** 2025-06-25

### Context

When `requiredBet = requiredReturn / rewardMultiplier` is not a multiple of `betStep`, we must choose rounding direction.

### Decision

Always use **ceiling** rounding: `bet = ceil(requiredBet / betStep) × betStep`.

Never round down.

### Rationale

Rounding down can produce `reward < totalSpent + desiredProfit`, violating the core business rule:

```
Reward >= TotalSpent + TargetProfit
```

Ceiling guarantees the constraint is satisfied (possibly with slight over-bet).

### Consequences

- Bets may be slightly higher than theoretical minimum
- User always meets profit target on win (never under-recovers)
- Must document in UI that bets are conservative (rounded up)

---

## ADR-003: Integer Arithmetic Preference

**Status:** Accepted  
**Date:** 2025-06-25

### Context

Floating-point arithmetic can introduce subtle bugs (e.g., `0.1 + 0.2 !== 0.3`).

### Decision

Prefer integer arithmetic for all monetary values. Inputs and outputs are integers (VND-style whole amounts).

Use floating-point only for ROI (ratio), which is display-only.

### Consequences

- No decimal bet amounts in Phase 1
- Simpler mental model for users
- Open question OQ-1 in PRD if decimal support needed later

---

## ADR-004: No Randomness, No Probability

**Status:** Accepted  
**Date:** 2025-06-25

### Context

Gambling tools often imply predictive power. This product explicitly rejects that.

### Decision

- No `Math.random()` or any random source in core
- No Monte Carlo simulation in Phase 1
- No language suggesting win probability improvement
- All outputs are deterministic given inputs

### Consequences

- Simulator (Phase 3) models **scenarios** (win at round N), not probability
- Marketing and UI copy must include disclaimer
- Legally safer positioning as "calculator" not "predictor"

---

## ADR-005: Vitest for Unit Testing

**Status:** Accepted  
**Date:** 2025-06-25

### Context

Need fast, TypeScript-native test runner compatible with Vite (future UI bundler).

### Decision

Use Vitest for all unit tests. 100% coverage target on public core functions.

### Consequences

- Same config works for core and UI tests
- Jest-compatible API (easy migration if needed)

---

## ADR-006: Strict TypeScript, No `any`

**Status:** Accepted  
**Date:** 2025-06-25

### Context

Type safety prevents calculation bugs from propagating to UI.

### Decision

- `strict: true` in tsconfig
- Never use `any`
- Never disable ESLint or TypeScript rules
- Use interfaces for all public types

### Consequences

- More upfront type definitions
- Refactoring caught at compile time

---

## ADR-007: Profit Mode as Enum String Union

**Status:** Accepted  
**Date:** 2025-06-25

### Context

Three profit modes with different `desiredProfit` formulas.

### Decision

Use string union type `'break-even' | 'fixed-profit' | 'percentage-profit'` rather than numeric codes or class hierarchy.

### Rationale

- Explicit and readable in logs/UI
- No Strategy Pattern overhead for three simple branches
- Pure function `computeDesiredProfit()` handles dispatch

### Consequences

- Adding new modes requires ADR + algorithm update
- No polymorphic class tree to maintain

---

## ADR-008: Memory Bank as Source of Truth for AI Development

**Status:** Accepted  
**Date:** 2025-06-25

### Context

AI coding assistants lose context after ~300–500 lines of code per session.

### Decision

Maintain `.memory-bank/` with project, architecture, rules, algorithms, current task, and progress. AI must read all files before coding.

### Consequences

- Discipline required to update progress.md and current-task.md after each task
- Conflicts resolved: business-rules > architecture > implementation
- Slower per-prompt but far fewer architectural regressions

---

## ADR-009: Sprint Workflow with Plan-Before-Code Gate

**Status:** Accepted  
**Date:** 2025-06-25

### Context

AI assistants tend to generate large diffs in one shot, skipping architectural review and causing rework.

### Decision

- Organize work into Sprints 0–8 (see ROADMAP.md)
- Every session starts with `session-start.md` checklist
- Cursor Rule `00-session.mdc` enforces Memory Bank reads
- **No code until user approves** architecture/plan (7-point plan for Sprint 1+)
- Max 3 files per implementation response
- Never auto-continue to next sprint/task

### Consequences

- Extra turn for planning; saves large refactors later
- User retains control of sprint pace
- `domain.md` added so AI understands betting domain without inventing probability logic

---

## ADR-010: Separate Review Agent (Self Review Gate)

**Status:** Accepted  
**Date:** 2025-06-25

### Context

Single AI session acting as Architect + Developer + Reviewer tends to approve its own code without scrutiny.

### Decision

- Add `review-checklist.md` and `done-definition.md`
- Add Cursor rule `01-review-agent.mdc` for review mindset
- Mandatory workflow: Implement → **Self Review** → Fix → Done
- Review step must NOT modify code; rate issues Critical/High/Medium/Low
- Task not complete until both checklists pass

### Consequences

- Extra interaction per mini-sprint
- Significantly fewer logic bugs and missing tests
- User approves fixes before they land

---

## ADR-011: Sprint 2 Split into Mini-Sprints (2.1–2.5)

**Status:** Accepted  
**Date:** 2025-06-25

### Context

Generating entire engine in one session (~1000+ lines) causes context loss and architectural drift.

### Decision

Split Sprint 2 into:

| Mini | Scope              |
| ---- | ------------------ |
| 2.1  | Types only         |
| 2.2  | ValidationEngine   |
| 2.3  | CalculationEngine  |
| 2.4  | OptimizationEngine |
| 2.5  | Tests + benchmark  |

Each mini-sprint: 200–500 lines max, full Plan→Review→Done cycle.

After 2.5: Sprint 2.D produces engine documentation before any UI.

### Consequences

- More sprint overhead
- Stable quality over long development
- `examples.md` and `test-cases.md` verified incrementally

---

## ADR-012: examples.md and test-cases.md as Golden References

**Status:** Accepted  
**Date:** 2025-06-25

### Context

Algorithm changes need regression anchors. AI may invent plausible-but-wrong expected values.

### Decision

- `examples.md`: hand-verified mathematical examples with full tables
- `test-cases.md`: authoritative test specifications
- Priority on conflict: algorithms.md > examples.md > test-cases.md > implementation
- Every algorithm change must pass all examples before Done

### Consequences

- Upfront effort to compute examples
- Tests and reviews have concrete ground truth

---

## ADR-013: ConstraintSolver Architecture (Rename from CalculationEngine)

**Status:** Accepted  
**Date:** 2025-06-25

### Context

App is a constraint optimization engine, not a simple calculator. "CalculationEngine" implies fixed formulas only.

### Decision

Rename and split modules:

- `ValidationEngine` — input constraints
- `ConstraintSolver` — satisfies invariants per round
- `StrategyGenerator` — public `generateStrategy()` orchestrator
- `SimulationEngine` — deterministic scenarios
- `OptimizationEngine` — uses Simulation (Sprint 4)
- `ReportGenerator` — export (Sprint 8)

See `system-map.md` for import rules.

### Consequences

- Clear extension path for new constraint types
- AI understands optimization semantics
- Public API: `generateStrategy()` not `calculateStrategy()`

---

## ADR-014: Simulation Before Optimization

**Status:** Accepted  
**Date:** 2025-06-25

### Context

Optimization needs to evaluate plans under scenarios. Building optimization before simulation creates wrong dependencies.

### Decision

Sprint order: Validation → ConstraintSolver → Simulation → Optimization (Sprint 4).

Remove Optimization from Sprint 2 mini-sprints.

### Consequences

- Sprint 2.4 = SimulationEngine
- Sprint 4 = OptimizationEngine with proof

---

## ADR-015: Invariants, Constraints, Glossary as First-Class Memory

**Status:** Accepted  
**Date:** 2025-06-25

### Context

AI confuses Reward vs Profit, guesses validation rules, skips edge cases.

### Decision

Add `invariants.md`, `constraints.md`, `glossary.md`, `system-map.md`.
After every Implement: verify all 7 invariants.
Reward Multiplier must be **> 1** (not just > 0).

### Consequences

- Longer session-start read list
- Fewer semantic bugs

---

## ADR-016: QA Agent + Git/TASKS Split

**Status:** Accepted  
**Date:** 2025-06-25

### Context

Reviewer approves own logic. No version history discipline. Cursor managing all state.

### Decision

- Add QA Agent (`02-qa-agent.mdc`) — break engine, report only
- Add `CHANGELOG.md` (Keep a Changelog)
- Add `TASKS.md` for backlog; Git for state; Memory Bank for requirements
- One commit per mini-sprint
- Recovery: checkout last good commit if AI drifts

### Consequences

- 4-agent chain: Architect → Developer → Reviewer → QA
- User controls sprint pace via Git

---

## ADR-017: Tech Stack Freeze (Sprint 0.5)

**Status:** Accepted  
**Date:** 2025-06-25

### Context

Without locked tech stack, AI adds Redux, Tailwind, Jest, npm, etc. across sprints.

### Decision

- `docs/TECH-STACK.md` — FROZEN before Sprint 1
- `docs/CODING-STANDARD.md` — style + export rules
- `docs/CONTRACTS.md` — inter-module contracts
- `docs/FOLDER-STRUCTURE.md` — locked paths
- Package manager: **pnpm** only
- UI: React 19 + Vite + MUI v7 + Zustand + RHF + Zod
- No Tailwind, Redux, Jest, database in MVP

### Consequences

- Sprint 1 blocked until user approves 0.5
- Violations are Review-blocking defects

---

## ADR-018: Algorithm Design Gate (Sprint 2.3+)

**Status:** Accepted  
**Date:** 2025-06-25

### Context

ConstraintSolver is core value. AI writing TypeScript first produces hard-to-fix algorithm bugs.

### Decision

Mandatory sequence before TypeScript for solver and optimization:

1. Pseudo-code → approve
2. Flowchart → approve
3. Test cases → approve
4. TypeScript implementation

Documented in `algorithm-design-process.md`.

### Consequences

- Extra design sprints before code
- TypeScript maps 1:1 to approved pseudo-code

---

## ADR-019: Four-Layer Architecture (pages → features → application → core)

**Status:** Accepted  
**Date:** 2025-06-25

### Decision

Replace `pages → hooks → core` with:

```
pages → features → application → core
```

Application orchestrates use cases. Core is pure computation. Features never import core directly.

---

## ADR-020: StrategyBuilder Separate from ConstraintSolver

**Status:** Accepted — **partially superseded by ADR-028**  
**Date:** 2025-06-25

### Decision

- **ConstraintSolver:** mathematics only → `Strategy`
- **StrategyBuilder:** transforms solver output → domain `Strategy` (no statistics)
- **StatisticsBuilder:** derived metrics → `StrategyStatistics` (ADR-028)

Enables Excel/PDF/API export without touching solver.

---

## ADR-021: Domain Models + Result<T,E>

**Status:** Accepted  
**Date:** 2025-06-25

### Decision

- All engine types in `src/core/models/`
- Public core APIs return `Result<T,E>` — no throw
- Models: Strategy, Round, Bet, Simulation, Constraint, OptimizationGoal

---

## ADR-022: StrategyAlgorithm Plugin Interface

**Status:** Accepted  
**Date:** 2025-06-25

### Decision

```typescript
interface StrategyAlgorithm {
  execute(input: StrategyInput): Result<SolverOutput, SolverError>;
}
```

One implementation per profit mode. Future modes (Kelly, Max Bankroll, etc.) = new plugin.

---

## ADR-023: Optimization Before Simulation (Dependency Flip)

**Status:** Accepted  
**Date:** 2025-06-25

### Decision

```
ConstraintSolver → OptimizationEngine → SimulationEngine (consumer)
```

Optimization uses Solver, not Simulation. Simulation evaluates built Strategy for display/Monte Carlo later.

---

## ADR-024: Test Fixtures

**Status:** Accepted  
**Date:** 2025-06-25

### Decision

Golden JSON in `tests/fixtures/`. Tests load fixtures — no duplicated hardcoded values.

---

## ADR-025: Path Aliases — tsconfig Single Source of Truth

**Status:** Accepted  
**Date:** 2025-06-25

### Context

Duplicate alias definitions in `tsconfig.json` and `vite.config.ts` `resolve.alias` drift over time.

### Decision

- **`tsconfig.json` `compilerOptions.paths`** is the single source of truth for all path aliases.
- **Vite/Vitest** use `vite-tsconfig-paths` plugin — no manual `resolve.alias` in `vite.config.ts`.
- Do not add `@/solver`, `@/models`, or other fine-grained aliases.
- Test-only smoke files live under `tests/smoke/` — never in `src/` for alias verification.

### Consequences

- One place to update paths when structure changes
- Cursor must not revert to manual `resolve.alias` without new ADR

---

## ADR-026: ValidationEngine Stable API (Freeze)

**Status:** Accepted — **FROZEN**  
**Date:** 2025-06-25  
**Sprint:** 2.2

### Context

ValidationEngine is the first production-grade core module. UI, API export, and localization will depend on stable error codes and contracts.

### Decision

1. **ValidationEngine is a Stable API** from Sprint 2.2 freeze onward.
2. **`ValidationResult` is domain-level only** — no UI fields (`displayMessage`, `localizedMessage`, `icon`, `severityColor`). UI maps at application/UI layer.
3. **Error codes (`S###`, `B###`, `M###`) are immutable after release.** Messages may change; codes must not.
4. **`ValidationError.message` is a developer message**, not end-user copy. UI/localization maps from `code` (+ optional `path`).
5. **`ValidationLayer`** is a string union (`'structural' | 'business' | 'mathematical'`) — no enum.
6. **Rules registry stays functional forever** — `structuralRules`, `businessRules`, `mathematicalRules` arrays; no class-based engine.
7. **Frozen rule shape:**

   ```typescript
   interface ValidationRule {
     readonly code: string;
     readonly path: string;
     readonly layer: ValidationLayer;
     readonly message: string;
     readonly isValid: (request: CalculationRequest) => boolean;
   }
   ```

8. **No validation statistics** (`executionTime`, `rulesExecuted`) — benchmarks belong elsewhere.
9. **Mutation testing** (e.g. Stryker) planned for Sprint 4 — not required for freeze.

### Versioning

Any change that adds fields, changes contract shape, or **changes error codes** requires a **major version** bump — not CHANGELOG-only.

### Consequences

- Validation can be treated as proven infrastructure before ConstraintSolver work.
- Localization and API docs anchor on stable codes.
- New rules = push to registry array; engine unchanged.

---

## ADR-027: ConstraintSolver Trust Boundary (No Re-validation)

**Status:** Accepted  
**Date:** 2025-06-25  
**Sprint:** 2.3

### Context

Duplicate validation in ConstraintSolver blurs module boundaries and invites divergent rules.

### Decision

ConstraintSolver **must not re-validate** any input field.

It receives **`ValidatedCalculationRequest`** and **assumes correctness**:

- No checks for `roundCount ≤ 0`, `multiplier ≤ 1`, `step ≤ 0`, etc.
- No coercion, defaults, or repair of input.

ValidationEngine owns all input correctness. Solver owns **mathematics only** — greedy bet sequence per algorithm paper.

Invalid input reaching the solver is a **ValidationEngine bug**, not a solver branch.

### Consequences

- Solver code stays O(N) pure math with no defensive duplication.
- Integration tests must always pipe requests through `validateCalculationRequest()` first.
- Sprint 2.3 design gate: algorithm paper → pseudo-code → state machine → manual proof → TypeScript → formal verification.

---

## ADR-028: StatisticsBuilder Separate from StrategyBuilder

**Status:** Accepted — **FROZEN**  
**Date:** 2025-06-25  
**Supersedes:** partial scope of ADR-020

### Context

Statistics (`averageBet`, `maximumBet`, `requiredBankroll`, etc.) are **derived data**, not part of the bet sequence. Mixing them into StrategyBuilder couples export/API concerns to domain transformation.

### Decision

Split pipeline responsibilities:

| Module                | Responsibility                                     | Output               |
| --------------------- | -------------------------------------------------- | -------------------- |
| **ConstraintSolver**  | Calculate bet sequence                             | `Strategy`           |
| **StrategyBuilder**   | Transform / normalize sequence → domain `Strategy` | `Strategy`           |
| **StatisticsBuilder** | Compute derived metrics                            | `StrategyStatistics` |
| **Application**       | Orchestrate pipeline                               | `StrategyResult`     |

ConstraintSolver returns **`Strategy` only** — never `StrategyResult` or `StrategyStatistics`.

StrategyBuilder **must not** compute statistics.

### Consequences

- CSV/PDF/GraphQL/API export can consume `StrategyStatistics` independently.
- Sprint 2.4 = StrategyBuilder; Sprint 2.5 = StatisticsBuilder; Sprint 2.6 = SimulationEngine.
- `SolverOutput` type deprecated — solver returns `Strategy` directly.

---

## ADR-029: ConstraintSolver Algorithm Paper Design Gate

**Status:** Accepted  
**Date:** 2025-06-25  
**Sprint:** 2.3

### Context

ConstraintSolver is the core value of the SDK. Pseudo-code alone is insufficient for review — the algorithm must be reviewable as a formal paper.

### Decision

ConstraintSolver design is documented as an **algorithm paper**:

**Path:** `docs/design/constraint-solver-algorithm.md`

Sections: Problem Definition, Assumptions (A1–A6), Objective Function, Decision Variable, State, Transition Function, Proof (Termination + Correctness + Optimality), Numerical Stability, Determinism, Contract.

Sprint 2.3 gate (6 steps):

```text
2.3A  Problem Definition
2.3B  Pseudo-code
2.3C  State Machine
2.3D  Manual Proof
2.3E  TypeScript
2.3F  Formal Verification
```

No TypeScript until 2.3A–D approved.

### Consequences

- Reviews focus on mathematical correctness, not file structure.
- State machine is explicit — not implicit in loop code.
- Assumption A6 (discrete bets) is part of optimality scope.

---

## ADR-030: SDK Identity and Package Naming

**Status:** Accepted  
**Date:** 2025-06-25  
**Amended:** 2025-06-25 (reject "Stake Engine" — see below)

### Context

The project has evolved from a personal app into a **Calculation Engine SDK**:

- `core` → publishable npm package
- `application` → orchestration layer
- `UI` → one consumer among many (Stake Planner app)

The engine solves capital / constraint / optimization / decision-sequence problems — not betting-specific math only.

### Decision

1. **Architecture identity is SDK** — frozen through v1.0.0.
2. **Do not rename the engine "Stake Engine"** — "Stake" implies betting/gambling and limits reuse (DCA, inventory, cost allocation, etc.).
3. **Proposed monorepo layout (future):**

   ```text
   apps/
     stake-planner/          ← UI product name (unchanged)
   packages/
     constraint-engine/      ← preferred core package name
   ```

   Alternatives under consideration: `constraint-planner`, `bankroll-engine`.

4. **Current repo** remains `stake-planner` until monorepo migration; package rename deferred until user selects final core name.
5. No further architectural splits after ADR-028.

### Consequences

- README references Stake Planner (app) + Calculation Engine SDK (core).
- Core npm name TBD — not `stake-engine`.
- Reviews from Sprint 2.3 onward: algorithm + public API only.

---

## ADR-031: ConstraintSolver Sequential Loop (No Array Helpers)

**Status:** Accepted  
**Date:** 2025-06-25  
**Sprint:** 2.3E

### Context

ConstraintSolver is a sequential state machine. Array helpers (`map`, `forEach`, `reduce`) obscure state transitions and add allocation on the hot path.

### Decision

Inside `src/core/solver/**` only:

- **Required:** explicit `for` loop for round iteration
- **Forbidden on hot path:** `forEach`, `reduce`, `map`

Documented in `docs/SOLVER-CODING-RULES.md`. Does **not** apply project-wide.

### Rationale

Easier proof, debug, benchmark, and formal verification alignment with algorithm paper §5–§6.

### Consequences

- ESLint rule or architecture test may enforce in Sprint 2.3E
- Tests and UI may continue using array helpers freely

---

## ADR-032: Specification Supremacy

**Status:** Accepted — **FROZEN**  
**Date:** 2025-06-25  
**Sprint:** 2.3D / 2.3E

### Context

ConstraintSolver design went through a multi-step design gate (algorithm paper, pseudo-code, state machine, constructive proof). Implementation must not silently diverge from frozen specifications.

### Decision

> **When implementation and specification disagree, implementation is assumed incorrect until specification is updated through the design gate.**

Process:

1. Stop implementation.
2. Amend frozen spec (ADR + user approval for algorithm changes).
3. Re-run affected design gate steps.
4. Resume implementation.

Applies to: pseudo-code, state machine, constructive proof, domain language, and mathematical specification for ConstraintSolver.

### Consequences

- `docs/design/constraint-solver-implementation-checklist.md` is the 2.3E release gate.
- Golden master tests protect frozen output behavior.
- No "code-led" specification changes.

---

## ADR-033: ConstraintSolver Stable Core (Production Ready)

**Status:** Accepted — **FROZEN**  
**Date:** 2025-06-25  
**Sprint:** 2.3F sign-off

### Context

ConstraintSolver completed the full design gate (2.3A–F): algorithm paper, pseudo-code, state machine, constructive proof, TypeScript implementation, formal verification (invariants, property tests, differential oracle).

Maintainer sign-off marks the solver as **Stable Core** — no further algorithm review unless specification changes through ADR-032.

### Decision

1. **ConstraintSolver** is **Production Ready**.
2. Public API is **Stable**: `solve(validated): Result<Strategy, never>`.
3. Specification and implementation are **Frozen** (2.3A–E + verification suite 2.3F).
4. **Release rules** (see `docs/RELEASE-RULES.md`):
   - Golden files are not auto-regenerated; PR must explain output changes.
   - Property test failures are not retried in CI (`retry: 0`).
5. Property test profiles: CI 2 000 runs; nightly 10 000; local stress 50 000+.

### Rationale

- `Result<Strategy, never>` preserves API stability for future arithmetic modes (overflow, bigint, configurable math) without breaking consumers.
- Differential testing (greedy vs brute-force oracle) provides stronger confidence than mutation testing for this optimization problem.
- SDK hardening (Sprint 2.7) should precede UI.

### Consequences

- Changes to `src/core/solver/**` require design gate + ADR — not drive-by fixes.
- StrategyBuilder (2.4) and StatisticsBuilder (2.5) build on frozen solver output.
- Mutation testing remains Sprint 4 (Stryker).

---

## ADR-034: StrategyBuilder — Canonical Aggregate Constructor

**Status:** Accepted — **FROZEN**  
**Date:** 2025-06-25  
**Sprint:** 2.4

### Context

After ConstraintSolver sign-off (ADR-033), the pipeline needs a stable boundary between algorithm output and domain aggregate. StrategyBuilder risks becoming a pass-through if its purpose is unclear.

### Decision

1. **StrategyBuilder is the canonical constructor** for `Strategy` from raw `Round[]` data. No other module may assemble `Strategy` via `{ rounds }`.
2. **Grandfathered exception:** Frozen `ConstraintSolver` (ADR-033) returns algorithm output as `{ rounds }`. Application orchestration **must** call `buildStrategy(solve(validated).value.rounds)` before downstream consumers.
3. **Immutable aggregate:** Ownership of `Round[]` transfers to `Strategy` on `buildStrategy(rounds)`. Caller must not mutate rounds after the call. No clone required today; `Object.freeze` in dev may be added later without API change.
4. **API:** `buildStrategy(rounds: readonly Round[]): Strategy` — pure function, no `Result`, no class/factory.
5. **Two contracts:** Pipeline never produces `[]`; builder accepts `buildStrategy([])` as valid.
6. **No derived information:** Builder must never compute derived values — including `rounds.length` / `roundCount`. All derived data → StatisticsBuilder (ADR-028).
7. **Golden tests** cover builder only (`Round[]` → `Strategy`), not solver integration.

### Rationale

- Boundary stability for SDK consumers and OptimizationEngine (ADR-020).
- Future `Strategy` fields (e.g. `algorithmId`, `tags`) assemble here without touching frozen solver.
- Statistics separation stays enforceable.

### Consequences

- Architecture tests enforce import isolation and canonical constructor rule.
- StatisticsBuilder (2.5) follows same philosophy: derived data only, no Strategy mutation, no solver calls.

---

## ADR-036: SimulationEngine — Deterministic Scenario Interpreter

**Status:** Accepted — **FROZEN**  
**Date:** 2025-06-25  
**Sprint:** 2.6

### Context

SimulationEngine is the first core module that produces an **event trace** rather than a pure aggregate transform. Risk of conflating "win at round W" scenario evaluation with future Monte Carlo / random simulation.

### Decision

1. **SimulationEngine interprets deterministic scenarios** — `simulateWinAtRound` is scenario evaluation, not probabilistic simulation.
2. **Canonical constructor** for `SimulationResult` — observational, never transformational.
3. **Strategy only** — must not read `StrategyStatistics` or request DTOs. No `runningBalance` in core (visualization layer).
4. **`RoundSimulation`** is a **projection** (`index`, `result`, `betAmount`, `accumulatedSpent`) — not a full `Round` copy.
5. **Invariant:** exactly one `Win` — `Lose*` → `Win` → `NotPlayed*`.
6. **Formulas:** `requiredBankrollAmount = round[W].accumulatedSpent`; `profitAmount` = terminal scenario profit (`reward − accumulatedSpent` at W). Document as terminal profit, not cumulative.
7. **`winningRoundIndex`** on output — self-contained JSON without request context.
8. **`Result<SimulationResult, SimulationError>`** — invalid scenario parameters are real errors.
9. **OptimizationEngine must not import or call SimulationEngine** — decision layer independent from observation.

### Rationale

- Keeps terminology room for future probabilistic modules.
- Prevents statistics leak and optimization coupling.
- Trace-based output without ledger semantics in core.

### Consequences

- `docs/CORE-STABILITY.md` documents stability map.
- Core domain pipeline architecturally complete after 2.6 sign-off.
- SDK Hardening (2.7) follows.

---

## ADR-037: SDK Release Policy — Public API, SemVer, ADR Discipline

**Status:** Accepted  
**Date:** 2025-06-25  
**Sprint:** 2.7

### Context

Core SDK v1 is complete (Validation through Simulation). Next phase is packaging for external consumers — mindset shifts from project development to **library maintenance**.

### Decision

1. **Public API:** Single supported entry — `public/index.ts` (package `exports`). Consumers import only curated symbols. Internal paths (`integer-math`, rule files, etc.) are not public.
2. **SemVer:** `docs/COMPATIBILITY-POLICY.md` — MAJOR = contract/behavior/golden; MINOR = additive; PATCH = fix/docs/perf-same-output.
3. **ADR discipline (from 2.7):** New ADRs only for breaking architecture, package layout, compatibility policy, public API policy. Small changes → CHANGELOG or design notes.
4. **Performance contract:** `docs/PERFORMANCE-CONTRACT.md` — O(N) solver, etc.; benchmarks as regression baseline.
5. **Freeze policy:** All Core SDK v1 modules require breaking review — `docs/CORE-STABILITY.md`.

### Consequences

- Sprint 2.7 prioritizes API audit over Typedoc volume.
- Optimization (Sprint 3) and UI remain after publishable core.
- Target `1.0.0` when public API and compat tests are locked.

---

## ADR-035: StatisticsBuilder — Canonical Derived Data Calculator

**Status:** Accepted — **FROZEN**  
**Date:** 2025-06-25  
**Sprint:** 2.5

### Context

After StrategyBuilder (ADR-034), derived metrics risk "statistics leak" into aggregate construction or solver. Contract 6b originally included `CalculationRequest` — inviting context-dependent statistics.

### Decision

1. **StatisticsBuilder is the canonical constructor** for `StrategyStatistics` from `Strategy` only.
2. **Observational, never transformational** — observe → derive → return. Never fix, normalize, repair, or recalculate `Strategy`.
3. **API:** `buildStatistics(strategy: Strategy): StrategyStatistics` — no request, no `Result`.
4. **Formulas (Strategy-only):**
   - `roundCount = rounds.length` (allowed here; forbidden on StrategyBuilder)
   - `requiredBankrollAmount = last.accumulatedSpent` (reads aggregate — not Σ betAmount)
   - `maximumBetAmount` / `minimumBetAmount` — min/max of `betAmount` (commutative)
   - `averageBetAmount = floor(Σ betAmount / N)` (commutative)
   - `expectedProfitAmount = last.rewardAmount − last.accumulatedSpent` — **terminal profit, not cumulative**
5. **Empty strategy:** all fields `0` (builder contract).
6. **Immutable snapshot** — statistics independent of later `Strategy` mutation.
7. **SimulationEngine** (future): uses `Strategy` only — **not** `StrategyStatistics`. Reporting vs execution — no cross-dependency.

### Rationale

- Statistics from aggregate only — no request leakage.
- `last.accumulatedSpent` reflects deserialized or external Strategies without proving I8.
- Commutative vs non-commutative stats documented for permutation tests.

### Consequences

- Contract 6b amended — `request` parameter removed.
- Implementation: single O(N) loop, no Strategy mutation.
- SDK Hardening (2.7) may add BigInt arithmetic.

---

## Template for New ADRs

```markdown
## ADR-XXX: Title

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-YYY
**Date:** YYYY-MM-DD

### Context

What is the issue?

### Decision

What was decided?

### Rationale

Why?

### Consequences

What becomes easier or harder?
```

---

_Before changing any decision marked Accepted, add a new ADR that supersedes the old one. Never silently reverse a decision._
