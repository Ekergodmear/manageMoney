# Test Infrastructure

Product Evolution sprint: **Test Infrastructure Stabilization**.

## Problem

Property tests with high `numRuns` (formerly 2 000–10 000 per suite) can run 10–30 minutes on Windows. Combined with OneDrive sync, antivirus, and file watchers, long-running Node processes may be killed (`exit 4294967295`) — this is infrastructure, not code quality.

## Solution

1. **Split suites** — `test:unit`, `test:property`, `test:integration`, etc.
2. **RC vs Nightly verify** — property runs at end of `pnpm verify` with `numRuns: 300`; failure → **READY FOR RC** (not pipeline red).
3. **Nightly** — `pnpm verify:nightly` runs property (5 000), soak, benchmarks.

## Windows / OneDrive

| Environment | Location | Notes |
| ----------- | -------- | ----- |
| **Development** | OneDrive | OK for daily work, `verify:quick`, `verify` (~3 min) |
| **Nightly** | Outside OneDrive | Clone to e.g. `C:\dev\earnmoney` for long property/soak runs |

Long test runs on synced folders may trigger:

- OneDrive file locking
- Antivirus scanning `node_modules` / vitest workers
- Junction / watcher instability

If verify hangs or exits with `4294967295`, move the repo off OneDrive and retry `pnpm verify:nightly`.

## Release gate

See [release-gate.md](../releases/release-gate.md). Property and performance are **nightly only** for Internal RC.
