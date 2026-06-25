# Sprint 2.7C — SDK Publish Candidate

**Status:** IN PROGRESS  
**Gate:** Complete before Sprint 3 (Optimization)  
**Sequence:** `2.7C → v1.0.0-rc → v1.0.0 → Sprint 3`

Core SDK v1 is **feature complete** (`API_FREEZE.md`). Sprint 2.7C locks **publish quality**, not new engine features.

---

## Mini-sprints

### 2.7C.1 — Documentation Release

**Goal:** Repository reads as a package outsiders can use.

| Deliverable                | Status |
| -------------------------- | ------ |
| README (publish version)   | ✅     |
| Installation               | ✅     |
| Quick Start                | ✅     |
| 5 capability examples      | ✅     |
| API link (`PUBLIC_API.md`) | ✅     |
| `LICENSE`                  | ✅     |
| `CONTRIBUTING.md`          | ✅     |

Not in scope: new internal docs, Typedoc (optional later in 2.7C or post-RC).

---

### 2.7C.2 — Benchmark Freeze

**Goal:** Performance Contract baseline — not optimization.

| Deliverable                        | Status |
| ---------------------------------- | ------ |
| `benchmarks/public-api.bench.ts`   | ✅     |
| `benchmarks/pipeline.bench.ts`     | ✅     |
| `docs/PERFORMANCE-CONTRACT.md`     | ✅     |
| `benchmarks/results/baseline.json` | ✅     |
| `benchmarks/BASELINE.md`           | ✅     |
| CI benchmark (record only)         | ✅     |

- Benchmarks call **public API only**
- Latency µs/op in artifact — **not** in PERFORMANCE-CONTRACT
- Memory profiling → roadmap

---

### 2.7C.3 — Packaging

**Goal:** `pnpm pack` produces the intended SDK artifact.

| Deliverable                         | Status |
| ----------------------------------- | ------ |
| `dist/index.js` + `dist/index.d.ts` | ✅     |
| `@stake/constraint-engine`          | ✅     |
| `files`, `exports`, `sideEffects`   | ✅     |
| Deep import + consumer smoke tests  | ✅     |
| `repository` / `homepage` / `bugs`  | ✅     |

---

### 2.7C.4 — Release Candidate

**Goal:** Release engineering only — no Core algorithm changes.

**Discipline:** push commit A first → verify → then bump `1.0.0-rc.1` (commit B) → tags on B.

| Step                                       | Status |
| ------------------------------------------ | ------ |
| `RELEASE_MANIFEST.md` + release discipline | ✅     |
| Push commit A (`main`)                     | ⏳     |
| Fresh-clone verify + `pnpm verify`         | ⏳     |
| Commit B `chore(release): v1.0.0-rc.1`     | ⏳     |
| Tags on commit B                           | ⏳     |

Full procedure: `RELEASE_MANIFEST.md` § Release discipline.

---

## Internal freeze tag

Tag `core-sdk-v1-freeze` on **commit B** (with `v1.0.0-rc.1`) — see `RELEASE_MANIFEST.md`.

**Purpose:** Known-good rollback anchor. Not an npm release.

---

## Sprint 3 mindset

Optimization is a **new module using Core SDK** — not an extension of v1 public surface.

```text
Core SDK (frozen public API)
        ▲
        │
OptimizationEngine (internal → future separate entry)
```

Solver is Production Ready — Optimization builds on Solver, does not modify Solver.

---

## References

- `API_FREEZE.md`
- `PUBLIC_API.md`
- `docs/PERFORMANCE-CONTRACT.md`
- `docs/design/sdk-hardening-spec.md`
