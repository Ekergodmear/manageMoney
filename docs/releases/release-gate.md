# Release Gate

Branch: `release/internal-rc`

Một commit **green** phải thực sự green trên **RC gates**. Property / performance là nightly.

## RC gates (required for Internal RC)

| Gate         | Command / source       | Required |
| ------------ | ---------------------- | -------- |
| Typecheck    | `pnpm typecheck`       | ✅ PASS   |
| Lint         | `pnpm lint`            | ✅ PASS   |
| Build        | `pnpm build:lib` + app | ✅ PASS   |
| Smoke        | `pnpm test:smoke`      | ✅ PASS   |
| Architecture | `pnpm test:architecture` | ✅ PASS |
| Unit         | `pnpm test:unit`       | ✅ PASS   |
| Integration  | `pnpm test:integration`| ✅ PASS   |
| Verify       | `pnpm verify`          | **READY FOR RC** |
| Warnings     | verify report          | **0**    |

## Nightly gates (not blocking RC)

| Gate        | Command              | Required |
| ----------- | -------------------- | -------- |
| Property    | `pnpm test:property` | ⚪ Nightly |
| Performance | `pnpm benchmark`     | ⚪ Nightly |
| Soak        | `pnpm soak:report`   | ⚪ Nightly |
| Full verify | `pnpm verify:nightly`| **READY** |

Property failure on `pnpm verify` → verdict **READY FOR RC** with note `except Property / Nightly gates`.

## Quality Score

Verify report includes a **Quality Score** out of 100:

| Category     | Points |
| ------------ | ------ |
| Typecheck    | 20     |
| Lint         | 20     |
| Tests        | 20     |
| Architecture | 20     |
| Build        | 20     |

Each category is **20** when PASS, **0** when FAIL. RC verdict also requires **Warnings: 0**.

## Daily vs pre-merge

| Script               | Khi nào                    | Thời gian ~ |
| -------------------- | -------------------------- | ----------- |
| `pnpm verify:quick`  | Phát triển hằng ngày       | 20–30s      |
| `pnpm verify`        | Trước commit / merge       | ~3 min      |
| `pnpm verify:nightly`| Trước RC / tag             | ~30 min     |
| `pnpm release:check` | Trước RC / tag             | 5+ phút     |

Xem [test-infrastructure.md](../development/test-infrastructure.md) — OneDrive vs nightly clone.

## Reports

- `reports/*-verify.md` — verdict **READY FOR RC** / **READY** / **NOT READY**
- `reports/eslint-summary.md` — lint debt waves
- `reports/soak-report.md` — Collector health
- `reports/release-report.md` — `pnpm release:check`

## Commit policy

Commit checkpoint khi RC gates PASS:

```text
Typecheck   PASS
Lint        PASS
Architecture PASS
Smoke       PASS
Build       PASS
Verify      READY FOR RC
```

Suggested message:

```text
chore(quality): stabilize verification pipeline
```

## Product Evolution sprints

1. **R1–R3** — Lint infrastructure + fix
2. **Test Infrastructure Stabilization** — suite split, RC vs nightly verify, property profiles
