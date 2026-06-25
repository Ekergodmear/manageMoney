# RFC Process

**Branch:** `optimization-v1` — specification + product line  
**Core SDK (`main`):** frozen at `v1.0.0-rc.1`

---

## Optimization RFCs (engine)

| RFC                                                   | Title                    | Status      |
| ----------------------------------------------------- | ------------------------ | ----------- |
| [RFC-001](optimization/RFC-001-why-optimization.md)   | Why Optimization         | ✅ Accepted |
| [RFC-002](optimization/RFC-002-assumptions.md)        | Optimization Assumptions | ✅ Accepted |
| [RFC-003](optimization/RFC-003-domain.md)             | Optimization Domain      | ✅ Accepted |
| [RFC-004](optimization/RFC-004-mathematical-model.md) | Mathematical Model       | ✅ Accepted |
| [RFC-005](optimization/RFC-005-request.md)            | Request & Result         | ✅ Accepted |

**Stack:** ✅ Complete — Optimization Engine Production Ready (Sprint 3.3).

---

## Product RFCs (Stake Planner)

**Index:** [`docs/rfc/product/README.md`](product/README.md)

| RFC | Title | Status |
| --- | ----- | ------ |
| [RFC-101](product/RFC-101-user-problem.md) | User Problem | ✅ Accepted |
| [RFC-102](product/RFC-102-user-journey.md) | User Journey | ✅ Accepted |

Sprint **3.5** — product specification, **no code**.

---

## Implementation phases

### Engine (`optimization-v1`)

```text
Sprint 3.1–3.3  Contracts → Search → Verification  ✅ frozen
```

### Product (after RFC-101/102)

```text
RFC-101  User Problem     ✅
RFC-102  User Journey     ✅
Demo CLI                 ← next (generate + optimize)
Sprint 4+                Product (React)
```

---

## References

- `docs/PROJECT-STATUS.md`
- `docs/design/optimization-formal-verification.md`
- `docs/rfc/optimization/OPTIMIZATION-INVARIANTS.md`
