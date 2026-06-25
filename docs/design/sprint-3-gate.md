# Sprint 3 — Gate (OptimizationEngine)

**Status:** Locked — effective after Core SDK v1 RC  
**Prerequisite:** Commit A pushed, commit B tagged (`v1.0.0-rc.1`)

---

## Branch policy (after RC)

`main` = release line. Sprint 3 does **not** continue on `main`.

```text
main
│
├── tag: core-sdk-v1-freeze
├── tag: v1.0.0-rc.1
│
└── optimization-v1    ← Sprint 3 (or feature/optimization)
```

| Branch | Role |
| ------ | ---- |
| `main` | Release / hotfix only — reflects published SDK state |
| `optimization-v1` | All OptimizationEngine work (Sprint 3+) |

**Benefits:**

- `main` always matches what was released
- Core bugs → fix on `main` (or `hotfix/*`) without Optimization noise
- Optimization can evolve aggressively without touching RC line

```bash
# After tags pushed to main:
git checkout -b optimization-v1
git push -u origin optimization-v1
```

---

## Optimization = SDK client

OptimizationEngine is a **client** of the public API — not an extension of `src/core/`.

```typescript
const validated = validateCalculationRequest(request);
if (validated.kind === 'failure') return validated.error;

const solved = solve(validated.value);
if (solved.kind === 'failure') return solved.error;

const strategy = buildStrategy(solved.value.rounds);
const statistics = buildStatistics(strategy);
const simulation = simulateWinAtRound(strategy, winAtRound);

// Optimization logic here — public API only
```

**Forbidden without ADR + spec gate:**

- Modifying `solve()` behavior
- Deep imports from `@/core/*`
- New exports in `src/public/index.ts` (see `API_FREEZE.md`)

---

## Maintainer review (Sprint 3+)

Architecture decisions are **locked**. Maintainer/reviewer focus — four criteria:

| Criterion     | Question |
| ------------- | -------- |
| Correctness   | Does the optimization algorithm match its specification? |
| Composition   | Does it use the Core SDK Public API correctly? |
| Isolation     | Is Optimization independent of Core internals? |
| Performance   | Does it meet expected complexity bounds? |

**Design test:** *If Core SDK were an npm package you cannot modify, would this design still work?*  
If yes → architecture is on track.

**Core change bar** — only with spec evidence:

| # | Gate question |
| - | ------------- |
| 1 | Uses Public API correctly? — `@stake/constraint-engine` only |
| 2 | Changes Core SDK behavior? — if yes → spec proof required |
| 3 | Breaks backward compatibility? — if yes → SemVer + ADR |
| 4 | Belongs in Optimization vs sneaking into Core? |

If (2) or (3) is "yes" → require specification evidence before merge.

**Not reviewed anymore:** new layers, architecture reshaping — settled in Sprints 2.1–2.7.

---

## Module boundary

```text
Core SDK (frozen on main)
        ▲
        │  public API only
        │
OptimizationEngine (optimization-v1)
```

Solver is Production Ready — Optimization **builds on** Solver, does not modify Solver.

---

## References

- `API_FREEZE.md`
- `PUBLIC_API.md`
- `RELEASE_MANIFEST.md`
- `specs/007-optimization/`
- ADR-037
