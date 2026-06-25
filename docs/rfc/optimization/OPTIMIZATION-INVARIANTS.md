# Optimization — Module Invariants

**Status:** Locked — regression if broken  
**Branch:** `optimization-v1`  
**Sprint 3.1:** Identity proven. **Maintainer sign-off:** approved.

---

## Architectural invariant

```text
Optimization → @/public → Core capabilities
```

Optimization **never** deep-imports `@/core/solver/*`, `validation`, `statistics-builder`, or `simulation`.

Enforced by: `tests/architecture/optimization-isolation.test.ts`

Core SDK does not know Optimization exists.

---

## Identity property (module axiom)

```text
If requiredBankroll(intent) ≤ bankrollLimit
Then optimize(request) returns intent unchanged
     with explanation.reason = IDENTITY
```

Not an example — a **theorem of the module** for all Sprint 3 refactors.

Property tests: `tests/unit/optimization/optimize-identity.test.ts`

---

## Monotonic budget property (Sprint 3.2+)

From RFC-004. Required once nested search ships:

```text
If budget₁ < budget₂
Then optimizedProfit(result₁) ≤ optimizedProfit(result₂)
```

Property-based test in Sprint 3.2C verification.

---

## Result boundary

`OptimizationResult` contains **only**:

- `request` (on success)
- `explanation` (structured)
- `code` (on failure)

**Never** in result: iterations, visited states, search nodes, attempts.

Search trace is implementation detail — not product contract.

---

## Public API boundary

`src/public/index.ts` **unchanged** until semantics, API, and explanation are stable.

Optimization remains an internal module (`src/core/optimization/`).

---

## References

- `docs/design/sprint-3.2-spec.md`
- `docs/rfc/optimization/RFC-004-mathematical-model.md`
- `docs/rfc/optimization/RFC-005-request.md`
