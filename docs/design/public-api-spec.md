# Public API — Specification (Sprint 2.7A)

**Status:** IMPLEMENTED — Sprint 2.7B  
**Authority:** ADR-037

---

## 1. Architecture

```text
Internal API (src/core/**, src/application/dto)
        │
        ▼
src/public/exports.ts    ← wiring only (re-export from internal)
        │
        ▼
src/public/index.ts      ← PUBLIC CONTRACT (reviewed on every API change)
        │
        ▼
package.json "exports"   ← only "." — deep import fails at resolution
        │
        ▼
Consumer
```

After 2.7A, two API classes exist:

| Class            | Policy                                                  |
| ---------------- | ------------------------------------------------------- |
| **Internal API** | Refactor allowed (design gate for frozen modules)       |
| **Public API**   | SemVer + breaking review — see `docs/CORE-STABILITY.md` |

---

## 2. Principles (locked)

1. **Public API is a contract** — not a convenience barrel. Every export must survive a 5-year support question.
2. **No implementation details** — see inventory §1 INTERNAL list.
3. **Export by capability** — five functions + types; not folder structure.
4. **Minimal model surface** — export types consumers read; omit construct-only internals. See `public-api-inventory.md`.
5. **Deep import must fail** — `package.json` exports only `"."`.
6. **Public API changes = breaking review candidate** — not always MAJOR, always reviewed.

---

## 3. File layout

```text
src/public/
  exports.ts    # Re-exports from @/core/* and @/application/dto — implementation of inventory
  index.ts      # Public contract — explicit export list (may re-export from exports.ts)
```

`index.ts` is the file maintainers diff-review. `exports.ts` keeps wiring out of the contract header/comments.

---

## 4. package.json (target)

```json
{
  "name": "@stake/constraint-engine",
  "exports": {
    ".": {
      "types": "./dist/public/index.d.ts",
      "import": "./dist/public/index.js"
    }
  }
}
```

No subpaths:

```typescript
import { solve } from '@stake/constraint-engine'; // ✅
import { solve } from '@stake/constraint-engine/core/solver'; // ❌ fails
```

During monorepo phase (pre-publish), compat tests import `@/public` via tsconfig path.

---

## 5. Compat test — API snapshot

**File:** `tests/compat/public-api-snapshot.test.ts`

```typescript
import * as SDK from '@/public';

const PUBLIC_EXPORTS = [
  'validateCalculationRequest',
  'solve',
  // ... frozen list from inventory
] as const;

it('public API matches frozen export list', () => {
  expect(Object.keys(SDK).sort()).toEqual([...PUBLIC_EXPORTS].sort());
});
```

Accidental export of `ceilDiv` → CI fails.

Optional: separate test that `PUBLIC_EXPORTS` has no unexpected **types** via `import type *` pattern or documented type export list.

---

## 6. Architecture tests

| Test                          | Purpose                                                  |
| ----------------------------- | -------------------------------------------------------- |
| `public-api-snapshot.test.ts` | Export list frozen                                       |
| `public-api-boundary.test.ts` | `src/public/**` only imports from allowed internal paths |
| `no-deep-import.test.ts`      | Consumer fixtures must not import `@/core/solver` etc.   |
| `package-exports.test.ts`     | `package.json` has single `"."` export                   |

**Scope:** No changes to `src/core/**` implementation in 2.7A — only `src/public/**`, tests, `package.json` exports field.

---

## 7. Implementation gate (2.7B)

After maintainer approves inventory + this spec:

- [x] Create `src/public/exports.ts` + `index.ts`
- [x] Add tsconfig paths `@/public`, `@stake/constraint-engine`
- [x] `package.json` exports (`.` only — package name rename deferred)
- [x] Compat snapshot test + ValidationCodes freeze/snapshot
- [x] Architecture boundary tests
- [x] `PUBLIC_API.md`
- [x] No core module changes

---

## 8. Open question for maintainer

**`StrategyResult` / `StrategyMetadata`:** classified **APPLICATION** — excluded from Core SDK v1. Confirm before 2.7B, or add in MINOR if single-package preferred.

---

## References

- `docs/design/public-api-inventory.md`
- `docs/COMPATIBILITY-POLICY.md`
- `docs/CORE-STABILITY.md`
