# Optimization RFC Process

**Branch:** `optimization-v1` only — **not** on `main`  
**Meaning:** Branch = specification development line for Optimization product.

Core SDK release line (`main`) stays frozen at `v1.0.0-rc.1`. Optimization proposals live here until RFCs are approved and Sprint 3 implementation begins.

---

## RFC index

| RFC                                                   | Title                    | Status      | Review order |
| ----------------------------------------------------- | ------------------------ | ----------- | ------------ |
| [RFC-001](optimization/RFC-001-why-optimization.md)   | Why Optimization         | ✅ Accepted | 1            |
| [RFC-002](optimization/RFC-002-assumptions.md)        | Optimization Assumptions | ✅ Accepted | 2            |
| [RFC-003](optimization/RFC-003-domain.md)             | Optimization Domain      | ✅ Accepted | 3            |
| [RFC-004](optimization/RFC-004-mathematical-model.md) | Mathematical Model       | ✅ Accepted | 4            |
| [RFC-005](optimization/RFC-005-request.md)            | Request & Result         | ✅ Accepted | 5            |

**RFC stack:** ✅ Complete — Sprint 3 implementation gate **open** on `optimization-v1`.  
**After approval:** RFCs may merge to `main` as historical record, or stay on branch — maintainer decision at Sprint 3 start.

---

## Future versions

Optimization v2+ uses new RFC numbers (e.g. RFC-010) without rewriting Sprint history.

---

## Implementation phases (after RFC approval)

```text
Sprint 3.1A  Contracts                    ✅
Sprint 3.1B  Identity (optimize)          ✅ maintainer sign-off
Sprint 3.2A  SearchPolicy                 planned
Sprint 3.2B  Profit search                planned
Sprint 3.2C  Nested search                planned
Sprint 3.3   Verification                 planned
```

See `docs/design/sprint-3.2-spec.md`, `docs/rfc/optimization/OPTIMIZATION-INVARIANTS.md`.

---

## References

- `docs/design/sprint-3-gate.md` — SDK client, review criteria
- `specs/007-optimization/` — legacy index
