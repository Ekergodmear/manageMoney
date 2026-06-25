# Spec 008 — Requirements

## 2.7A / 2.7B — Public API (done)

- [x] `public/index.ts` — single supported export surface
- [x] `package.json` `exports` field
- [x] Architecture test — public boundary + no deep subpaths
- [x] Compat snapshot test
- [x] `PUBLIC_API.md`, `API_FREEZE.md`

## 2.7C.1 — Documentation Release

- [x] README publish version
- [x] Installation + Quick Start
- [x] 5 capability examples
- [x] API link
- [x] LICENSE
- [x] CONTRIBUTING.md

## 2.7C.2 — Benchmark Freeze

- [x] Benchmarks via public API only
- [x] Baselines in `benchmarks/results/baseline.json` (not absolute numbers in contract)
- [x] `docs/PERFORMANCE-CONTRACT.md` — complexity + regression policy
- [x] CI record-only

## 2.7C.3 — Packaging

- [x] `exports`, `types`, `files`, `sideEffects`
- [x] Build `dist/index.js` + `dist/index.d.ts`
- [x] Rename `@stake/constraint-engine`
- [x] `pnpm pack` consumer smoke test
- [x] Deep import rejection test
- [ ] `repository`, `homepage`, `bugs` — at RC when repo is public

## 2.7C.4 — Release Candidate

- [ ] `v1.0.0-rc.1`
- [ ] Install + import verification
- [ ] `v1.0.0`
- [ ] Migration Guide at publish
- [ ] Tag `core-sdk-v1-freeze`

## Policy

- [x] ADR only for breaking architecture (ADR-037)
- [x] `docs/CORE-STABILITY.md` freeze table
- [x] `docs/COMPATIBILITY-POLICY.md`

## Optional

- [ ] Typedoc from `src/public/index.ts` only
