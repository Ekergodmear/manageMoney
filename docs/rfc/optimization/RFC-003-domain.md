# RFC-003 — Optimization Domain

**Status:** ✅ **Accepted** (maintainer, 2026-06-25)  
**Prerequisite:** [RFC-002 Assumptions](RFC-002-assumptions.md) ✅  
**Next:** [RFC-004 Mathematical Model](RFC-004-mathematical-model.md) — Minimal Change formalization

---

## Purpose

RFC-002 answers: _"What may Optimization change?"_  
RFC-003 answers: _"What does Optimization optimize?"_

This is a **product problem**, not a pure math extremum problem.

---

## Optimization Principle

```text
Optimization never changes more variables than necessary.
```

**Minimal Change Principle:** If feasibility can be achieved by adjusting **one** knob (e.g. profit 100k → 95k), Optimization must **not** also change another (e.g. rounds 50 → 48).

Optimization preserves **user intent** with the smallest deviation that satisfies new constraints.

---

## User Intent

Optimization always retains the **original request** as reference.

| Role                                    | Example                     |
| --------------------------------------- | --------------------------- |
| **Original request** (user intent)      | x20, 50 rounds, 100k profit |
| **New constraint** (optimization input) | Bankroll ≤ 500k             |

Optimization does not forget the original. It searches for the **closest feasible** candidate to that intent.

```text
distance(original, candidate) → minimize (under lexicographic order)
```

---

## Primary objective (v1)

**Rejected for v1:** Multi-objective (min bankroll + min max bet + max ROI + …).

**Rejected for v1:** "Minimize required bankroll" as Optimization's goal.

Core SDK already minimizes Σ bet for a fixed request. That is the solver's job.

**v1 single objective:**

```text
Find the closest feasible request to user intent.
```

Optimization answers:

> _What is the nearest plan to what you wanted that still works under your new constraint?_

Not:

> _What is the smallest bankroll possible?_

### Example

|            | Value                   |
| ---------- | ----------------------- |
| User wants | Profit 100k, 50 rounds  |
| Core says  | Required bankroll 1.52M |
| User has   | 500k                    |

Optimization seeks a feasible request **closest** to (100k, 50 rounds) with `requiredBankroll ≤ 500k` — e.g. profit reduced to 31k while preserving 50 rounds, with explanation.

---

## Hard constraints (v1)

| Constraint       | Role                                       |
| ---------------- | ------------------------------------------ |
| `bankrollLimit`  | Primary user constraint (e.g. ≤ 500k)      |
| Core feasibility | `validate` + `solve` success per candidate |

Deferred v1: `maxBetLimit`, `minRoi` — future RFC if needed.

---

## Allowed knobs (from RFC-002)

| Knob          | Field          | Direction | Condition                |
| ------------- | -------------- | --------- | ------------------------ |
| Target profit | `targetProfit` | Decrease  | Always                   |
| Round count   | `rounds`       | Decrease  | If `allowRoundReduction` |

Fixed: `rewardMultiplier`, `minimumBet`, `betStep`, `profitMode`.

Search: [A12 monotonic](RFC-002-assumptions.md#a12--monotonic-search).

---

## Distance & lexicographic order (v1)

Distance components (conceptual):

```text
distance = (profit_loss, round_loss)
```

| Component     | Definition (v1)                                   |
| ------------- | ------------------------------------------------- |
| `profit_loss` | How far candidate profit is below original target |
| `round_loss`  | How far candidate rounds are below original count |

**v1 ordering: lexicographic** — not weighted sum.

| Priority | Dimension                             |
| -------- | ------------------------------------- |
| 1        | Profit (preserve target profit first) |
| 2        | Rounds (preserve round count second)  |

### Ruled example (maintainer)

Original: 100k profit, 50 rounds.

| Candidate | Profit | Rounds | `(profit_loss, round_loss)` |
| --------- | ------ | ------ | --------------------------- |
| A         | 95k    | 50     | (5k, 0)                     |
| B         | 100k   | 30     | (0, 20)                     |

**Lexicographic (profit first):** B wins — `(0, 20)` beats `(5000, 0)` because profit_loss is compared first.

Formal definition → [RFC-004](RFC-004-mathematical-model.md).

Weights and weighted sums → **rejected for v1**.

---

## Output shape (v1)

| Option             | v1               |
| ------------------ | ---------------- |
| Single best answer | ✅ **Only this** |
| Ranked list        | ❌ Rejected      |
| Pareto set         | ❌ Rejected      |

API returns **one** `OptimizationResult`. UI may offer "Try another optimization" as a **new call** — not multiple candidates in one response.

---

## OptimizationResult (domain shape)

```text
Success:
  Optimized Request
  → Strategy (via Core)
  → Statistics (via Core)
  → Explanation

Failure:
  No feasible solution
```

Not Validation failure. Not Solver failure alone. **Optimization** could not find any candidate in the search space satisfying constraints.

---

## OptimizationExplanation

Human-readable summary for UI. Example:

```text
Unable to satisfy 100k profit with 500k bankroll.
Target profit reduced to 31k while preserving 50 rounds.
```

Explanation is a **first-class** part of the result — not debug-only.

---

## Failure domain

Optimization may fail when no feasible candidate exists.

Example:

```text
100 rounds, 100M profit, bankroll limit 20k
```

→ `No feasible solution` — Optimization domain failure.

Distinct from:

- Validation errors on a single request
- Solver infeasibility on the original request without search

---

## Rejected for v1

- Multi-objective optimization
- Pareto frontier
- Ranked candidate lists
- Weighted distance scores
- Changing environment parameters (RFC-002)

---

## Maintainer checklist

- [x] Single objective: closest feasible to user intent
- [x] User Intent concept
- [x] Distance + lexicographic (profit → rounds)
- [x] Minimal Change Principle
- [x] One best answer only
- [x] Explanation required
- [x] Optimization-level failure
- [x] Domain boundary locked → **RFC-004 ready for review**

---

## References

- [RFC-002 Assumptions](RFC-002-assumptions.md)
- [RFC-004 Mathematical Model](RFC-004-mathematical-model.md)
- [RFC-005 Request & Result](RFC-005-request.md)
