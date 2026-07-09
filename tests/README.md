# Test layout

Logical suites (see `package.json` scripts). Paths may span multiple folders until a full physical move.

| Suite | Path / command | Role |
| ----- | -------------- | ---- |
| **Unit** | `pnpm test:unit` | Core logic, fast |
| **Integration** | `pnpm test:integration` | Game data, notifications, consumer |
| **Property** | `pnpm test:property` | fast-check (nightly profile) |
| **Architecture** | `pnpm test:architecture` | Import / boundary rules |
| **Smoke** | `pnpm test:smoke` | Rollout + statistics + public API |
| **Performance** | `pnpm benchmark` | Benchmarks (nightly) |

## Property run profiles

Configured in `tests/support/property-runs.ts`:

| Profile | `numRuns` | When |
| ------- | --------- | ---- |
| `rc` | 300 | `pnpm verify`, pre-commit |
| `nightly` | 5 000 | `pnpm verify:nightly` |
| `stress` | 50 000 | Local stress only |

Long-running **capital** integration (`tests/integration/capital`) — run via `pnpm test:integration`; may hang on OneDrive (see docs).

## Verify

| Script | ~time | Property |
| ------ | ----- | -------- |
| `pnpm verify:quick` | 20s | No |
| `pnpm verify` | ~3 min | RC profile, non-blocking |
| `pnpm verify:nightly` | ~30 min | Full property + soak + benchmark |

Verdict **READY FOR RC** when RC gates pass; property failure is reported but does not block Internal RC.
