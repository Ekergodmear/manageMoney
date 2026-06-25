# Benchmark Baseline — Reference Environments

Absolute µs/op values are **environment-specific**. This file records **provenance** — not performance targets.

See `docs/PERFORMANCE-CONTRACT.md` for complexity guarantees and regression policy.

---

## Reference measurements

| SDK version | Label  | Node     | CPU               | OS        | Commit | Runner | Profiles                     | Date       | Artifact                |
| ----------- | ------ | -------- | ----------------- | --------- | ------ | ------ | ---------------------------- | ---------- | ----------------------- |
| 0.2.0       | pre-rc | v24.11.1 | AMD Ryzen 7 5800H | win32/x64 | n/a    | 1.0.0  | small, medium, large, stress | 2025-06-25 | `results/baseline.json` |

**Profiles:** `small` (5), `medium` (50), `large` (500), `stress` (5,000) rounds — golden fixed input.

---

## `baseline.json` schema (v2)

```json
{
  "schemaVersion": 2,
  "sdkVersion": "0.2.0",
  "benchmarkRunnerVersion": "1.0.0",
  "gitCommitSha": "<sha or null>",
  "nodeVersion": "v22.x",
  "platform": "linux",
  "arch": "x64",
  "cpu": "...",
  "profiles": ["small", "medium", "large", "stress"],
  "results": {
    "latency": [{ "capability", "scenario", "roundCount", "latencyUsPerOp", "unit" }]
  }
}
```

Bump `benchmarkRunnerVersion` in `benchmarks/lib/runner-version.ts` when runner logic changes.

---

## Correctness vs performance

| Layer               | Proves                       |
| ------------------- | ---------------------------- |
| Unit / golden tests | Correctness on fixed cases   |
| Property / formal   | Mathematical invariants      |
| **Benchmark**       | Latency characteristics only |

Benchmark pass does **not** imply solver correctness.

---

## Refreshing baseline

At `v1.0.0-rc.1` on a maintainer reference machine:

```bash
pnpm benchmark -- --record
```

Commit `results/baseline.json` and add a row to the table above.

---

## Regression (same machine)

- Review if any capability exceeds **2×** prior latency on the **same** hardware
- Complexity class change → mandatory design review

Do not use cross-machine absolute values for CI gates.
