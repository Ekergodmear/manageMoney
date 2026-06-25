# RFC-003 — Optimization Domain

**Status:** Draft — **ready for maintainer review** (RFC-002 accepted)  
**Prerequisite:** [RFC-002 Assumptions](RFC-002-assumptions.md) ✅  
**Next:** [RFC-004 Mathematical Model](RFC-004-mathematical-model.md)

---

## Purpose

Freeze **goals**, **constraints**, and **knobs** for Optimization v1.  
Knobs are **locked** by [RFC-002 parameter classification](RFC-002-assumptions.md#parameter-classification).

---

## Allowed knobs (from RFC-002)

| Knob          | Request field  | Direction | Condition                         |
| ------------- | -------------- | --------- | --------------------------------- |
| Target profit | `targetProfit` | Decrease  | Always (primary knob)             |
| Round count   | `rounds`       | Decrease  | Only if `allowRoundReduction` set |

**Fixed (not knobs):** `rewardMultiplier`, `minimumBet`, `betStep`, `profitMode` — new request required to change.

**Objective (derived):** `requiredBankroll` — not directly set; minimized or constrained.

**Search discipline:** [A12 Monotonic search](RFC-002-assumptions.md#a12--monotonic-search).

---

## Optimization goals (candidate catalog — maintainer picks v1 subset)

| ID  | Goal                       | In v1? |
| --- | -------------------------- | ------ |
| G1  | Minimize required bankroll | TBD    |
| G2  | Maximize expected profit   | TBD    |
| G3  | Minimize maximum bet       | TBD    |
| G4  | Minimize average bet       | TBD    |
| G5  | Bankroll ≤ X (hard)        | TBD    |
| G6  | Max bet ≤ X (hard)         | TBD    |
| G7  | ROI ≥ X (hard)             | TBD    |

**Review focus:** single objective vs multi-objective; ranking vs Pareto.

---

## Output shape (product)

| Option      | Description                  |
| ----------- | ---------------------------- |
| Single best | One recommendation           |
| Ranked list | Top N plans                  |
| Pareto set  | Multiple non-dominated plans |

**Maintainer decision:** v1 output shape.

---

## Open questions (RFC-003)

- [ ] Which goals from catalog are in v1?
- [ ] Single objective vs multi-objective?
- [ ] Tie-breaking when multiple plans meet constraints?
- [ ] "Best effort" partial success vs hard failure?

---

## References

- [RFC-002 Assumptions](RFC-002-assumptions.md)
- [RFC-004 Mathematical Model](RFC-004-mathematical-model.md)
