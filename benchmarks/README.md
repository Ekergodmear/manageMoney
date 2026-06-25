# Benchmarks

Performance baseline for Core SDK v1 — **public API only**.

Benchmarks exist to support the **Performance Contract**, not to optimize for leaderboard scores.

---

## Run

```bash
pnpm benchmark              # → benchmarks/results/latest.json + table
pnpm benchmark -- --record  # → also updates baseline.json (maintainer freeze)
```

Requires Node.js ≥ 22.

---

## Files

| File                    | Role                                 |
| ----------------------- | ------------------------------------ |
| `scenarios.ts`          | Fixed golden inputs (small → stress) |
| `public-api.bench.ts`   | Per-capability latency (primary)     |
| `pipeline.bench.ts`     | End-to-end pipeline (supplementary)  |
| `run.ts`                | Orchestrator + JSON artifact         |
| `results/baseline.json` | Committed reference measurements     |
| `BASELINE.md`           | Environment provenance               |

---

## Scenarios

| Name   | Rounds |
| ------ | ------ |
| small  | 5      |
| medium | 50     |
| large  | 500    |
| stress | 5,000  |

---

## Policy

See `docs/PERFORMANCE-CONTRACT.md`:

- No internal imports
- No random data
- Latency only (memory later)
- CI records — does not fail on absolute µs/op

---

## Updating baseline

At release candidate (`v1.0.0-rc.1`), run on a reference machine:

```bash
pnpm benchmark -- --record
```

Commit `results/baseline.json` and update `BASELINE.md` with environment row.
