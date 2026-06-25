# RFC-003 — Optimization Domain

**Status:** Draft — blocked until [RFC-002](RFC-002-assumptions.md) accepted  
**Prerequisite:** RFC-002 assumptions signed off  
**Next:** [RFC-004 Mathematical Model](RFC-004-mathematical-model.md)

---

## Purpose

Freeze **goals**, **constraints**, and **knobs** for Optimization v1.  
Knobs must match **accepted** assumptions in RFC-002 only.

---

## Problem class

Constrained multi-criteria decision over discrete changes to `CalculationRequest`, evaluated via Core SDK public pipeline.

---

## Optimization goals (candidate catalog — pick v1 subset)

| ID  | Goal                       | In v1? |
| --- | -------------------------- | ------ |
| G1  | Minimize required bankroll | TBD    |
| G2  | Maximize expected profit   | TBD    |
| G3  | Minimize maximum bet       | TBD    |
| G4  | Minimize average bet       | TBD    |
| G5  | Bankroll ≤ X (hard)        | TBD    |
| G6  | Max bet ≤ X (hard)         | TBD    |
| G7  | ROI ≥ X (hard)             | TBD    |

---

## Decision knobs (must align with RFC-002)

Only parameters marked **user-adjustable** in RFC-002 appear here.

| Knob          | Request field      | Example    | RFC-002                 |
| ------------- | ------------------ | ---------- | ----------------------- |
| Target profit | `targetProfit`     | 100k → 80k | A6, A8                  |
| Round count   | `rounds`           | 50 → 30    | A7                      |
| Multiplier    | `rewardMultiplier` | —          | **Only if A9 accepted** |
| Minimum bet   | `minimumBet`       | —          | **Only if A4 rejected** |
| Profit mode   | `profitMode`       | —          | **Only if A5 rejected** |

---

## Output shape (product)

| Option      | Description                  |
| ----------- | ---------------------------- |
| Single best | One recommendation           |
| Ranked list | Top N plans                  |
| Pareto set  | Multiple non-dominated plans |

**Maintainer decision:** v1 output shape.

---

## Open questions

- [ ] Tie-breaking when multiple plans meet constraints?
- [ ] "Best effort" partial success vs hard failure?
- [ ] Interaction with `KNOWN_LIMITATIONS.md`

---

## References

- [RFC-002 Assumptions](RFC-002-assumptions.md)
- [RFC-004 Mathematical Model](RFC-004-mathematical-model.md)
