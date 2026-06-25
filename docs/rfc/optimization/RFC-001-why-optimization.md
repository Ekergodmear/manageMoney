# RFC-001 — Why Optimization

**Status:** Draft  
**Branch:** `optimization-v1`  
**Next:** [RFC-002 Assumptions](RFC-002-assumptions.md)

---

## Summary

Core SDK answers feasibility for **one** plan. Optimization answers **what to change** when that plan does not fit user reality.

---

## One sentence

**Core SDK:** _"What is the minimum bankroll for this plan?"_  
**Optimization:** _"Given what I actually have, what should I change?"_

---

## What Core SDK does (and stops)

```text
validate → solve → buildStrategy → buildStatistics → simulate
```

Solver objective (frozen): **min Σ bet** → minimum required bankroll.

Example:

```text
Input:  x20, 50 rounds, 100k target profit
Output: Required bankroll = 1,520,000
```

User: _"I only have 500,000."_

Core SDK does not search alternatives. That is **out of scope** — not a bug.

---

## Optimization is a Decision Engine

| Option | Change               | Example    |
| ------ | -------------------- | ---------- |
| A      | Reduce target profit | 100k → 80k |
| B      | Reduce rounds        | 50 → 30    |
| C      | Change multiplier    | x20 → x25  |
| D      | Raise minimum bet    | ↑          |
| E      | Change strategy mode | TBD        |

Which options are **allowed** is a **domain** decision → [RFC-002](RFC-002-assumptions.md).

```text
User constraints + objective
        │
        ▼
OptimizationEngine
        │
        ▼
Core SDK (frozen public API)
```

---

## Solver vs Optimization

|               | ConstraintSolver | OptimizationEngine        |
| ------------- | ---------------- | ------------------------- |
| Role          | One plan         | Choose among plans        |
| Objectives    | min Σ bet        | Multi-objective (RFC-003) |
| Changes Core? | —                | **Never** without ADR     |

---

## Non-goals (Optimization v1)

Optimization v1 will **not**:

| #   | Non-goal                                                    |
| --- | ----------------------------------------------------------- |
| N1  | Use machine learning                                        |
| N2  | Use Monte Carlo simulation                                  |
| N3  | Use genetic algorithms or metaheuristics marketed as "AI"   |
| N4  | Brute-force the entire discrete search space without bounds |
| N5  | Change the ConstraintSolver objective or implementation     |
| N6  | Change Core SDK Public API (`API_FREEZE.md`)                |
| N7  | Ship as part of Core SDK package surface                    |
| N8  | Replace UI — UI remains a future consumer                   |

**Principle:** Say what we will not do, not only what we will do.

---

## Why not extend Core SDK?

1. Public API frozen — tag `core-sdk-v1-freeze`
2. Solver has one proven objective
3. Different outputs (recommendations vs single feasible plan)
4. Different complexity class (bounded search over knobs)

**Design test:** If Core SDK were an npm package you cannot modify, would Optimization still be a separate module? **Yes.**

---

## RFC sequence (review order)

1. RFC-001 Why (this document)
2. RFC-002 Assumptions — **what may Optimization change?**
3. RFC-003 Domain — goals, knobs, constraints
4. RFC-004 Mathematical model
5. RFC-005 Request & Result — API shape last

---

## References

- `PUBLIC_API.md` (on `main`)
- `KNOWN_LIMITATIONS.md` (on `main`)
- [RFC-002 Assumptions](RFC-002-assumptions.md)
