# Optimization RFC Process

**Branch:** `optimization-v1` only — **not** on `main`  
**Meaning:** Branch = specification development line for Optimization product.

Core SDK release line (`main`) stays frozen at `v1.0.0-rc.1`. Optimization proposals live here until RFCs are approved and Sprint 3 implementation begins.

---

## RFC index

| RFC                                                   | Title                    | Status      | Review order |
| ----------------------------------------------------- | ------------------------ | ----------- | ------------ |
| [RFC-001](optimization/RFC-001-why-optimization.md)   | Why Optimization         | Draft       | 1            |
| [RFC-002](optimization/RFC-002-assumptions.md)        | Optimization Assumptions | ✅ Accepted | 2            |
| [RFC-003](optimization/RFC-003-domain.md)             | Optimization Domain      | ✅ Accepted | 3            |
| [RFC-004](optimization/RFC-004-mathematical-model.md) | Mathematical Model       | Draft       | 4            |
| [RFC-005](optimization/RFC-005-request.md)            | Request & Result         | Draft       | 5            |

**Gate:** No Sprint 3 code until all RFCs are maintainer-approved.  
**After approval:** RFCs may merge to `main` as historical record, or stay on branch — maintainer decision at Sprint 3 start.

---

## Future versions

Optimization v2+ uses new RFC numbers (e.g. RFC-010) without rewriting Sprint history.

---

## Implementation phases (after RFC approval)

```text
Sprint 3.1  Mathematical model implementation checks
Sprint 3.2  Request/Result types
Sprint 3.3  Search / solver
Sprint 3.4  SDK composition
Sprint 3.5  Verification
```

---

## References

- `docs/design/sprint-3-gate.md` — SDK client, review criteria
- `specs/007-optimization/` — legacy index
