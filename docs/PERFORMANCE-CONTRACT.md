# Performance Contract — Core SDK v1

**Status:** FROZEN — Sprint 2.7C.2  
**Purpose:** Lock expected complexity and regression policy — not absolute speed targets.

Benchmarks measure **consumer experience** via public API only. They are **not** optimization targets.

---

## Complexity guarantees

| Public function              | Time | Space | Notes                                 |
| ---------------------------- | ---- | ----- | ------------------------------------- |
| `validateCalculationRequest` | O(R) | O(1)  | R = fixed rule count (not roundCount) |
| `solve`                      | O(N) | O(N)  | N = `roundCount`                      |
| `buildStrategy`              | O(1) | O(1)  | Aggregate reference; no copy          |
| `buildStatistics`            | O(N) | O(1)  | Single pass                           |
| `simulateWinAtRound`         | O(N) | O(N)  | Single scenario pass                  |
| `pipeline` (composite)       | O(N) | O(N)  | Supplementary benchmark only          |

**Forbidden without ADR + MAJOR review:** hot path becoming O(N²) or worse (especially `solve`).

---

## Benchmark scenarios (fixed golden input)

| Name   | `roundCount` | Purpose      |
| ------ | ------------ | ------------ |
| small  | 5            | Smoke / fast |
| medium | 50           | Typical      |
| large  | 500          | Scale        |
| stress | 5,000        | Upper stress |

Shared parameters: `rewardMultiplier: 20`, `minimumBet: 10_000`, `betStep: 1_000`, `targetProfit: fixedAmount 100_000`.

No random input. See `benchmarks/scenarios.ts`.

---

## What we benchmark

### Primary — per capability (`benchmarks/public-api.bench.ts`)

Each function measured **in isolation** (inputs pre-computed outside timed region):

- `validateCalculationRequest`
- `solve`
- `buildStrategy`
- `buildStatistics`
- `simulateWinAtRound`

### Supplementary — end-to-end (`benchmarks/pipeline.bench.ts`)

Full pipeline per scenario. **Not** the primary regression baseline.

---

## What we do not benchmark

- Internal helpers (`ceilDiv`, `resolveTarget`, `solveMinimalFeasibleBet`, …)
- Deep imports from `@/core/*`
- Randomized inputs

---

## Latency vs memory

| Dimension | Status       | Unit     |
| --------- | ------------ | -------- |
| Latency   | **Measured** | µs/op    |
| Memory    | **Roadmap**  | bytes/op |

Do not combine allocation and throughput in one metric.

---

## Artifacts (environment-specific)

Absolute µs/op **must not** appear in this contract file.

| Artifact                           | Purpose                          |
| ---------------------------------- | -------------------------------- |
| `benchmarks/results/baseline.json` | Committed reference measurements |
| `benchmarks/results/latest.json`   | Last local/CI run (gitignored)   |
| `benchmarks/BASELINE.md`           | Environment table + how to read  |

Run:

```bash
pnpm benchmark           # write latest.json + stdout table
pnpm benchmark -- --record   # also refresh baseline.json (maintainer)
```

---

Benchmark pass does **not** prove algorithmic correctness.

| Layer                          | Role                         |
| ------------------------------ | ---------------------------- |
| Tests + golden fixtures        | Correctness on fixed cases   |
| Property / formal verification | Mathematical invariants      |
| **Benchmark**                  | Latency characteristics only |

❌ Wrong: "benchmark pass → solver is correct."  
✅ Right: each layer has a separate job.

---

## Regression policy

| Change                            | Action                         |
| --------------------------------- | ------------------------------ |
| Complexity class changes          | **Mandatory** design review    |
| Latency regression (same machine) | Review if > **2×** vs baseline |
| Memory regression (when measured) | Review if significant increase |
| CI benchmark step                 | **Record only** — no hard fail |

Small cross-machine variance is expected. Do not fail CI on absolute µs/op thresholds.

**Policy intent:** detect accidental regressions and complexity drift — not chase microsecond wins.

PRs that sacrifice readability for marginal benchmark gains → **reject**.

---

## CI

`pnpm benchmark` runs on CI, uploads `latest.json` as workflow artifact. Does not gate merge on latency.

---

## References

- `benchmarks/README.md`
- `benchmarks/BASELINE.md`
- ADR-031 (solver loop discipline)
- `API_FREEZE.md`
