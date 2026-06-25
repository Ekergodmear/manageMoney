# Release Rules — ConstraintSolver & Core Tests

**Status:** Active — Sprint 2.3F sign-off  
**Applies to:** `tests/fixtures/solver/**`, `tests/unit/solver/**`

---

## Rule 1 — Golden files are not auto-regenerated

Golden master files (`tests/fixtures/solver/*.golden.json`) are **frozen behavioral contracts**.

If a PR changes golden output:

1. The PR **must explain why** solver output changed.
2. Algorithm or specification changes require the **design gate** (ADR-032) before updating goldens.
3. **Forbidden:** merge after blind regeneration (`vitest -u`, `npm test --update`, or equivalent).

Golden tests compare `JSON.stringify(Strategy)` byte-for-byte. Any change is intentional and reviewable.

---

## Rule 2 — Property failures are not retried

Property-based tests (`fast-check`) must **fail CI on first counterexample**.

- `retry: 0` in Vitest config — no automatic reruns.
- **Forbidden:** "rerun until green" in CI or nightly workflows.
- A property failure is a real bug or a spec/implementation mismatch — investigate, do not mask.

---

## Property test profiles

| Profile | Runs    | Command                     |
| ------- | ------- | --------------------------- |
| CI      | 2 000   | `pnpm test` (default)       |
| Nightly | 10 000  | `pnpm test:property`        |
| Stress  | 50 000+ | `pnpm test:property:stress` |

Stress tests are for local or scheduled runs — not standard CI.

---

## References

- `docs/design/constraint-solver-formal-verification.md`
- ADR-032 Specification Supremacy
- ADR-033 ConstraintSolver Stable Core
