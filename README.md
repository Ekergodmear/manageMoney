# Calculation Engine SDK

**Constraint-based bankroll planning** — validate input, solve optimal bets, build strategy aggregates, derive statistics, and run deterministic simulations.

|                    |                                                                            |
| ------------------ | -------------------------------------------------------------------------- |
| **Status**         | Core SDK v1 feature complete — publish candidate in progress (Sprint 2.7C) |
| **Public API**     | [`src/public/index.ts`](src/public/index.ts)                               |
| **Future package** | `@stake/constraint-engine`                                                 |
| **License**        | [MIT](LICENSE)                                                             |

> This repository also contains the **Stake Planner** UI (a consumer app). The SDK lives under `src/core/` and is exposed only via [`src/public/index.ts`](src/public/index.ts).

---

## Installation

```bash
npm install @stake/constraint-engine
```

Pre-release (monorepo):

```bash
git clone https://github.com/Ekergodmear/manageMoney.git
cd manageMoney
pnpm install
pnpm build:lib
```

Requires **Node.js ≥ 22**.

---

## Quick Start

Full pipeline using the public API:

```typescript
import {
  validateCalculationRequest,
  solve,
  buildStrategy,
  buildStatistics,
  simulateWinAtRound,
} from '@stake/constraint-engine';

const request = {
  rewardMultiplier: 20,
  roundCount: 5,
  minimumBet: 10_000,
  betStep: 1_000,
  targetProfit: { mode: 'fixedAmount', amount: 100_000 },
} as const;

const validated = validateCalculationRequest(request);
if (validated.kind === 'failure') {
  console.error(validated.error);
  process.exit(1);
}

const solved = solve(validated.value);
if (solved.kind === 'failure') {
  throw new Error('solver should not fail on valid input');
}

const strategy = buildStrategy(solved.value.rounds);
const statistics = buildStatistics(strategy);
const simulation = simulateWinAtRound(strategy, 3);

if (simulation.kind === 'success') {
  console.log(statistics.requiredBankrollAmount);
  console.log(simulation.value.winningRoundIndex);
}
```

---

## Capabilities

Five public functions — use cases, not internal layers.

### 1. `validateCalculationRequest`

Trust boundary. Returns `Result<ValidatedCalculationRequest, ValidationResult>`.

```typescript
import { validateCalculationRequest, ValidationCodes } from '@stake/constraint-engine';

const result = validateCalculationRequest(request);

if (result.kind === 'failure') {
  for (const err of result.error.errors) {
    if (err.code === ValidationCodes.B001_REWARD_MULTIPLIER_TOO_LOW) {
      // handle business rule violation
    }
  }
}
```

### 2. `solve`

Optimal betting plan. Returns `Result<Strategy, SolverError>` (`SolverError` is `never` on valid input).

```typescript
import { solve } from '@stake/constraint-engine';

const result = solve(validatedRequest);
if (result.kind === 'success') {
  const { rounds } = result.value;
  console.log(rounds[0]?.betAmount);
}
```

### 3. `buildStrategy`

Canonical `Strategy` aggregate from `Round[]`.

```typescript
import { buildStrategy } from '@stake/constraint-engine';

const strategy = buildStrategy(solved.value.rounds);
```

### 4. `buildStatistics`

Observational snapshot — does not mutate `Strategy`.

```typescript
import { buildStatistics } from '@stake/constraint-engine';

const stats = buildStatistics(strategy);
// stats.requiredBankrollAmount, stats.averageBetAmount, stats.expectedProfitAmount
```

### 5. `simulateWinAtRound`

Deterministic scenario: win at round _k_, lose elsewhere.

```typescript
import { simulateWinAtRound } from '@stake/constraint-engine';

const result = simulateWinAtRound(strategy, 3);
if (result.kind === 'success') {
  console.log(result.value.rounds);
}
```

---

## API Reference

| Document                                                       | Purpose                          |
| -------------------------------------------------------------- | -------------------------------- |
| [`PUBLIC_API.md`](PUBLIC_API.md)                               | Supported symbols + stable since |
| [`RELEASE_MANIFEST.md`](RELEASE_MANIFEST.md)                   | Pre-flight checklist + RC gate   |
| [`API_FREEZE.md`](API_FREEZE.md)                               | Frozen capabilities (v1)         |
| [`docs/COMPATIBILITY-POLICY.md`](docs/COMPATIBILITY-POLICY.md) | SemVer rules                     |

Typedoc — run `pnpm docs:api` (output: `docs-api/`, public exports only).

---

## Development

```bash
pnpm install
pnpm verify
```

| Script                  | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `pnpm build:lib`        | SDK → `dist/index.js`                               |
| `pnpm build:app`        | UI → `dist-app/`                                    |
| `pnpm verify`           | lint + typecheck + build:lib + test + build:app     |
| `pnpm test:property`    | property tests (nightly profile)                    |
| `pnpm benchmark`        | latency baseline → `benchmarks/results/latest.json` |
| `pnpm benchmark:record` | refresh committed `baseline.json` (maintainer)      |

---

## Architecture (contributors)

```text
Construction          Observation
─────────────         ───────────
ValidationEngine      StatisticsBuilder
ConstraintSolver      SimulationEngine
StrategyBuilder
```

| Layer         | Path                          |
| ------------- | ----------------------------- |
| Public API    | `src/public/index.ts`         |
| Engine        | `src/core/`                   |
| DTOs          | `src/application/dto/`        |
| UI (consumer) | `src/features/`, `src/pages/` |

See [`docs/CORE-STABILITY.md`](docs/CORE-STABILITY.md) and [`ROADMAP.md`](ROADMAP.md).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

[MIT](LICENSE)
