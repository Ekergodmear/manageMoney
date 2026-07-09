# Sprint 3.3 — Formal Verification

**Status:** ✅ **FROZEN**  
**Prerequisite:** Sprint 3.2C.2 ✅ (profit + round search frozen)  
**Branch:** `optimization-v1`

---

## Goal

Answer:

> _Does evidence show the engine is correct per RFC in bounded and property-tested cases?_

No new features. Verification only.

---

## 3.3A — RFC compliance mapping ✅

No code changes. Requirement → test traceability:

### RFC-001 — Why Optimization

| Requirement                      | Evidence                                       |
| -------------------------------- | ---------------------------------------------- |
| Composes Core SDK, not Solver v2 | `optimization-isolation.test.ts`               |
| Decision engine over public API  | `optimize-identity.test.ts` (pipeline compose) |

### RFC-002 — Assumptions

| Requirement                                                   | Evidence                                                              |
| ------------------------------------------------------------- | --------------------------------------------------------------------- |
| A4 `allowRoundReduction` gates round search                   | `optimize-round-search.test.ts`, `optimize-nested-properties.test.ts` |
| A12 monotonic search steps                                    | `search-policy.test.ts`, `optimization-isolation.test.ts`             |
| `fixedAmount` profit search; other modes deterministic `null` | `search-policy.test.ts`                                               |
| Environment params fixed on candidates                        | `candidates.test.ts` (only profit/round shaped)                       |

### RFC-003 — Domain

| Requirement                               | Evidence                                          |
| ----------------------------------------- | ------------------------------------------------- |
| Identity / closest feasible intent        | `optimize-identity.test.ts`, O-P2 minimal change  |
| Lexicographic `(profit_loss, round_loss)` | `brute-force-optimization.ts`, O-P2, differential |
| Single result + explanation               | `optimization-contract.test.ts`, O-P3             |
| `NO_FEASIBLE_SOLUTION` failure domain     | `optimize-identity.test.ts`, O-P4                 |

### RFC-004 — Mathematical model

| Requirement                                | Evidence                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| Identity branch                            | `optimize-identity.test.ts`                                            |
| Nested search order                        | `optimize-nested-properties.test.ts`, `canonicalNestedEvaluationOrder` |
| First feasible wins (at fixed round level) | `optimize-profit-properties.test.ts`                                   |
| Monotonic budget                           | `optimize-profit-properties.test.ts`                                   |
| Prefix stability                           | `optimize-profit-properties.test.ts`                                   |
| Determinism                                | O-P1 `optimize-formal-properties.test.ts`                              |
| SearchPolicy boundary                      | `search-policy.test.ts`, `OPTIMIZATION-INVARIANTS.md`                  |

### RFC-005 — Request & result

| Requirement                                 | Evidence                              |
| ------------------------------------------- | ------------------------------------- |
| `OptimizationRequest` shape                 | `optimization-contract.test.ts`       |
| Structured `OptimizationExplanation`        | `optimization-contract.test.ts`, O-P3 |
| No validation codes in optimization failure | `optimize-identity.test.ts`           |
| No search state in result                   | `optimization-contract.test.ts`       |

### Module invariants

| Requirement                  | Evidence               |
| ---------------------------- | ---------------------- |
| `OPTIMIZATION-INVARIANTS.md` | All rows covered above |

**Gate:** No RFC requirement without test evidence.

---

## 3.3B — Missing properties ✅

| Property                       | ID   | File                                 |
| ------------------------------ | ---- | ------------------------------------ |
| Determinism (1000×)            | O-P1 | `optimize-formal-properties.test.ts` |
| Minimal change (lexicographic) | O-P2 | `optimize-formal-properties.test.ts` |
| Explanation consistency        | O-P3 | `optimize-formal-properties.test.ts` |
| Failure completeness           | O-P4 | `optimize-formal-properties.test.ts` |

---

## 3.3C — Differential testing ✅

| Item   | Detail                                      |
| ------ | ------------------------------------------- |
| Oracle | `tests/support/brute-force-optimization.ts` |
| Bounds | `roundCount ≤ 6`, `profit ≤ 50k`            |
| Runs   | 150 (`fast-check`)                          |
| Test   | `optimize.differential.test.ts`             |

---

## 3.3D — Freeze ✅

| Item                                              | Status                                 |
| ------------------------------------------------- | -------------------------------------- |
| All verification tests pass                       | ✅                                     |
| `docs/design/optimization-formal-verification.md` | ✅                                     |
| `OPTIMIZATION-INVARIANTS.md` updated              | ✅                                     |
| Optimization Engine                               | **Production Ready** (internal module) |

---

## After 3.3 — product roadmap

No Sprint 3.4 / 3.5 engine features.

Next phase:

```text
Stake Planner Web
  → React UI
  → Input → Generate → Optimize → Simulate → Export → Deploy
```

Rejected before UI: Pareto, multi-objective, ML, Monte Carlo (RFC non-goals).

---

## References

- `docs/design/optimization-formal-verification.md`
- `docs/design/sprint-3.2-spec.md`
- `docs/rfc/optimization/`
