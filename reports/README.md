# Verification Reports

Automated quality reports for Stake Planner (Product Evolution — Observability).

## Commands

| Script | Output |
| --- | --- |
| `pnpm verify` | Typecheck → Lint → Unit → Architecture → Game Data → Notifications → Build |
| `pnpm soak:report` | Collector soak analysis (requires collector on `:8788`) |
| `pnpm release:check` | Full release gate + verdict |

## Files

| File | Description |
| --- | --- |
| `YYYY-MM-DD-verify.md` | Human-readable verify report for each run |
| `latest.json` | Machine-readable latest verify result |
| `trend.json` | Historical verify runs (tests, duration) |
| `soak-report.md` | Collector uptime, gaps, duplicates, statistics |
| `release-report.md` | Pre-release gate with READY / NOT READY verdict |

## Git metadata

Reports include `git rev-parse HEAD` and `git branch --show-current` when git is available.

## Environment

- `COLLECTOR_HTTP_URL` — override collector base URL (default `http://localhost:8788`)

Temporary vitest JSON output: `reports/.tmp-vitest.json` (safe to delete).
