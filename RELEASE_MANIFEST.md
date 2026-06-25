# Release Manifest — Core SDK v1

**Purpose:** Maintainer pre-flight checklist before `v1.0.0-rc.1`.  
**Status:** Release Candidate Ready (technical) — metadata pending public repo.

---

## Pre-flight

| Item                  | Status   | Reference                                                                        |
| --------------------- | -------- | -------------------------------------------------------------------------------- |
| Public API            | Frozen   | `API_FREEZE.md`, `src/public/index.ts`                                           |
| Compatibility Policy  | Locked   | `docs/COMPATIBILITY-POLICY.md`                                                   |
| Performance Contract  | Locked   | `docs/PERFORMANCE-CONTRACT.md`                                                   |
| Consumer Smoke        | Pass     | `tests/consumer/consumer-smoke.test.ts`                                          |
| Deep Import           | Rejected | `tests/compat/deep-import.test.ts`                                               |
| Benchmark Baseline    | Recorded | `benchmarks/results/baseline.json`                                               |
| License               | MIT      | `LICENSE`                                                                        |
| Typedoc (public only) | ✅       | `pnpm docs:api` → `docs-api/`                                                    |
| Repository metadata   | ✅       | [github.com/Ekergodmear/manageMoney](https://github.com/Ekergodmear/manageMoney) |

---

## Package size baseline

Measured `@stake/constraint-engine@0.2.0` after `pnpm build:lib` + `pnpm pack` (2025-06-25).

| Metric           | Size    | Notes                                 |
| ---------------- | ------- | ------------------------------------- |
| Tarball          | ~15 KB  | `stake-constraint-engine-0.2.0.tgz`   |
| Unpacked `dist/` | ~50 KB  | `index.js` + `index.d.ts` + sourcemap |
| Published files  | 3 paths | `dist/`, `README.md`, `LICENSE` only  |

**Policy:** Review if tarball doubles without justified new capability or dependency.

Refresh before RC:

```bash
pnpm build:lib
pnpm pack --pack-destination .pack
```

Update this table in the RC PR.

---

## Zero placeholder policy

**Locked for all releases.**

| Rule                                       | Action                      |
| ------------------------------------------ | --------------------------- |
| No `https://example.com`                   | Omit field                  |
| No `"TODO"` in `package.json`              | Omit field                  |
| No fake `repository` / `homepage` / `bugs` | Add only when URLs are real |
| No placeholder `author`                    | Omit or use real identity   |

If a URL does not exist yet → **do not declare it**.

---

## Tag policy

Two tags, two purposes:

| Tag                  | When                                | Purpose                  |
| -------------------- | ----------------------------------- | ------------------------ |
| `core-sdk-v1-freeze` | Core feature-complete + publishable | Internal rollback anchor |
| `v1.0.0-rc.1`        | Release candidate published         | User-facing RC           |

```bash
# After final verify, before npm publish:
git tag -a core-sdk-v1-freeze -m "Core SDK v1 frozen — public API + packaging"
git tag -a v1.0.0-rc.1 -m "Release candidate 1.0.0-rc.1"
```

Order: **freeze first**, then **RC**.

---

## Manual install verification

Automated: `tests/consumer/` (pnpm pack → install → pipeline).

**Additional manual step** before npm publish — clean project:

```bash
pnpm build:lib
pnpm pack --pack-destination .pack

mkdir verify-install
cd verify-install
npm init -y
npm install ../.pack/stake-constraint-engine-*.tgz
npm ls @stake/constraint-engine
node -e "import('@stake/constraint-engine').then(m => console.log(Object.keys(m).sort().join(',')))"
```

Expect: 5 capabilities + `ValidationCodes` — no deep import paths.

---

## Release discipline (locked)

**Version bump after push** — tag `v1.0.0-rc.1` must point at the release metadata commit, not a "preparing release" commit.

### Order

| Step | Action                                                  |
| ---- | ------------------------------------------------------- |
| 1    | Commit full current state                               |
| 2    | `git branch -M main` (recommended before first RC)      |
| 3    | Push to GitHub                                          |
| 4    | Verify from fresh clone (README, LICENSE, metadata, CI) |
| 5    | `pnpm verify` on pushed commit                          |
| 6    | Bump `1.0.0-rc.1` + CHANGELOG date                      |
| 7    | Release-only commit → tags → push tags                  |

### Two-commit history

| Commit | Message                                 | Contents                                  |
| ------ | --------------------------------------- | ----------------------------------------- |
| **A**  | `Core SDK v1 — release candidate ready` | Full codebase freeze                      |
| **B**  | `chore(release): v1.0.0-rc.1`           | `package.json` version + `CHANGELOG` only |

Tags on **commit B** (after release commit):

```bash
git tag -a core-sdk-v1-freeze -m "Core SDK v1 frozen"
git tag -a v1.0.0-rc.1 -m "Release candidate 1.0.0-rc.1"
git push origin main --tags
```

### Commands (reference)

```bash
git add .
git commit -m "Core SDK v1 — release candidate ready"

git branch -M main
git remote add origin https://github.com/Ekergodmear/manageMoney.git
git push -u origin main

# Fresh-machine check + verify on pushed commit
pnpm verify

# Edit package.json → 1.0.0-rc.1, CHANGELOG date
git add package.json CHANGELOG.md
git commit -m "chore(release): v1.0.0-rc.1"

git tag -a core-sdk-v1-freeze -m "Core SDK v1 frozen"
git tag -a v1.0.0-rc.1 -m "Release candidate 1.0.0-rc.1"
git push origin main --tags
```

**Default branch:** use `main` before first RC — CI already watches `main` and `master`.

---

## 2.7C.4 remaining

- [x] Real `repository`, `homepage`, `bugs` — [Ekergodmear/manageMoney](https://github.com/Ekergodmear/manageMoney)
- [x] `pnpm docs:api` — Typedoc → `docs-api/`
- [ ] Push commit A to GitHub + fresh-clone verify
- [ ] `pnpm verify` on pushed commit
- [ ] Commit B — bump `1.0.0-rc.1` + CHANGELOG date
- [ ] Tags: `core-sdk-v1-freeze`, `v1.0.0-rc.1`

**After RC:** No Core SDK commits without explicit reason (bug, spec gap, designed API change).

---

## Sprint 3 gate

> Optimization is a module **on** Core SDK — not a reason to modify Core SDK.

See **`docs/design/sprint-3-gate.md`** — branch policy (`optimization-v1`), four review questions, SDK-client pattern.

After RC tags on `main`:

```bash
git checkout -b optimization-v1
git push -u origin optimization-v1
```

---

## References

- `PUBLIC_API.md`
- `docs/design/sprint-2.7c-spec.md`
- `benchmarks/BASELINE.md`
