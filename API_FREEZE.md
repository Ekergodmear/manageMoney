# API Freeze — Core SDK v1

**Status:** FROZEN — effective Sprint 2.7B sign-off  
**Authority:** ADR-037, `PUBLIC_API.md`, `src/public/index.ts`

---

## Frozen capabilities

| Symbol                       | Status | Stable Since |
| ---------------------------- | ------ | ------------ |
| `validateCalculationRequest` | Frozen | 1.0.0        |
| `solve`                      | Frozen | 1.0.0        |
| `buildStrategy`              | Frozen | 1.0.0        |
| `buildStatistics`            | Frozen | 1.0.0        |
| `simulateWinAtRound`         | Frozen | 1.0.0        |

| Symbol            | Status | Stable Since |
| ----------------- | ------ | ------------ |
| `ValidationCodes` | Frozen | 1.0.0        |

**No new capabilities** may be added to Core SDK v1 public surface without a breaking review (ADR + SemVer per `docs/COMPATIBILITY-POLICY.md`).

---

## Policy

> Core SDK v1 is **feature complete** for the calculation engine.  
> Do not add new public capabilities to `src/public/index.ts` as part of Sprint 3 or other internal work.

| Change type                        | Allowed without MAJOR? |
| ---------------------------------- | ---------------------- |
| Refactor internal (`src/core/**`)  | Yes — design gate only |
| New type-only export on public API | Review required        |
| New runtime export on public API   | Breaking review        |
| Rename / remove public symbol      | MAJOR                  |

---

## Sprint 3 — OptimizationEngine

Optimization is a **new module**, not an extension of the frozen public surface.

- `OptimizationEngine` must **not** add exports to `src/public/index.ts` in v1.
- Future optimization APIs belong in a **separate entry** or **v2** — decided via ADR before any public export.

---

## Related documents

| Document                              | Role                       |
| ------------------------------------- | -------------------------- |
| `PUBLIC_API.md`                       | What the SDK supports      |
| `docs/design/public-api-inventory.md` | Full symbol classification |
| `docs/CORE-STABILITY.md`              | Module freeze map          |
| `docs/COMPATIBILITY-POLICY.md`        | SemVer rules               |

---

## Deferred (not part of this freeze)

- **Migration Guide** (`0.x → 1.0`) — add at first npm publish
- **Internal tag** `core-sdk-v1-freeze` — end of Sprint 2.7C (see `docs/design/sprint-2.7c-spec.md`)
