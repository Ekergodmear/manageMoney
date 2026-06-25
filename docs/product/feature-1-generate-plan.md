# Feature 1 — Generate Plan

**Product:** Stake Planner  
**Status:** Brief + wireframe — ready to implement  
**Prerequisite:** Platform stable (`@stake/constraint-engine`)  
**References:** [RFC-101](../rfc/product/RFC-101-user-problem.md) · [RFC-102](../rfc/product/RFC-102-user-journey.md)

---

## Product Brief

### Goal

User enters how they want to play and gets a **clear plan** — especially **how much bankroll they need** — without reading documentation or knowing engine terminology.

### User story

> As someone who already knows my reward rule, rounds, and target profit,  
> I want to **generate a plan in one step**,  
> so I know whether my idea is feasible and what it costs.

### Success metric

| Metric | Target |
| ------ | ------ |
| Time to first useful result | **< 30 seconds** (new user, no docs) |
| Comprehension | User can state required bankroll, target profit, and max bet **without help** |
| Validation recovery | User knows **which field** to fix on error |
| Next step clarity | User knows to tap **View Plan** — no “what now?” moment |

### Out of scope (Feature 1)

- Improve Plan (optimize)
- Simulation
- Export
- Animation / loading polish (Trust Plan)
- History, auth, compare plans
- Percentage profit mode (v1: **fixed amount only**)

---

## UX decisions

| Question | Decision | Rationale |
| -------- | -------- | --------- |
| First screen purpose? | Collect **intent** — “I want to play like this” | RFC-102: Generate is entry point |
| Primary CTA label? | **Generate Plan** | Product language; not “Calculate” or “Solve” |
| What shows first after Generate? | **Decision screen** — 3 numbers + clear next step | Answers “what should I do now?” — not just data dump |
| Stats on decision screen? | **Only 3:** required bankroll, expected profit, maximum bet | Enough to decide; rest in View Plan |
| Validation errors? | **Inline** on the field | DoD: user knows what to fix immediately |
| Required bankroll > budget? | **Message only** — no Improve Plan button yet | Feature 2; optional bankroll field enables self-check |
| Engine terms in UI? | **Never** — no Strategy, Statistics, Solver | User-facing copy only |

### Optional input (Feature 1)

**Your bankroll** (optional) — if filled, Result screen compares:

```text
Your bankroll:     1,000,000
Required:          1,520,000
→ You may need to adjust your plan.
```

No optimize action until Feature 2.

---

## Wireframes (ASCII)

### Screen A — Generate

```text
┌──────────────────────────────────────┐
│ Stake Planner                        │
│ Lập kế hoạch — biết cần bao nhiêu vốn│
├──────────────────────────────────────┤
│                                      │
│ Lợi nhuận mục tiêu        [100,000] │
│ Số vòng                   [     50] │
│ Hệ số thưởng              [     20] │
│ Cược tối thiểu            [ 10,000] │
│ Bước cược                 [  1,000] │
│                                      │
│ Vốn của bạn (tùy chọn)    [       ] │
│                                      │
│         [ Generate Plan ]            │
│                                      │
└──────────────────────────────────────┘
```

Inline error example (field-level):

```text
│ Số vòng                   [   0.5] │
│   ⚠ Phải là số nguyên               │
```

---

### Screen B — Decision (plan generated)

Shown immediately after successful Generate. **Decision screen** — answers *“Bây giờ tôi nên làm gì?”* Not a passive summary.

**Only 3 numbers** (no average bet, min bet, round count on this screen):

```text
┌──────────────────────────────────────┐
│ ← Sửa ý định                         │
├──────────────────────────────────────┤
│                                      │
│ Plan Generated                       │
│                                      │
│ Required bankroll                    │
│ 1,520,000                            │
│                                      │
│ Expected profit                      │
│ 100,000                              │
│                                      │
│ Maximum bet                          │
│ 81,000                               │
│                                      │
│ ✓ Your plan is ready.                │
│                                      │
│            [ View Plan ]             │
│                                      │
└──────────────────────────────────────┘
```

**If optional bankroll entered and insufficient:**

```text
│ ⚠ Your bankroll is only 1,000,000    │
│   Required: 1,520,000                │
│                                      │
│ ✓ Plan generated — review before use. │
│                                      │
│            [ View Plan ]             │
```

No **Improve Plan** button in Feature 1. Feature 2 replaces the warning block with `[ Improve Plan ]` CTA — same screen structure.

**If bankroll optional not entered:** show `✓ Your plan is ready.` only.

---

### Screen C — Plan detail (View Plan)

Round-by-round table. User chose to drill in.

```text
┌──────────────────────────────────────┐
│ ← Kết quả                            │
├──────────────────────────────────────┤
│ Kế hoạch — 50 vòng                   │
│                                      │
│ Vòng │ Cược    │ Tích lũy chi        │
│ ─────┼─────────┼──────────────       │
│   1  │  10,000 │      10,000         │
│   2  │  11,000 │      21,000         │
│  ... │   ...   │        ...          │
│  50  │  81,000 │   1,520,000         │
│                                      │
│ Vốn cần: 1,520,000                   │
│                                      │
└──────────────────────────────────────┘
```

Scrollable table. No export, no simulation CTA in Feature 1.

---

## Flow

```text
Screen A (form)
    │  [ Generate Plan ]
    ▼
  validate → solve → buildStrategy → buildStatistics
    │
    ├─ failure → inline errors on Screen A
    │
    └─ success → Screen B (decision)
                      │
                      │  [ View Plan ]
                      ▼
                 Screen C (round table)
```

---

## Definition of Done

- [ ] New user completes Generate Plan in **< 30 seconds** without docs
- [ ] UI uses **no engine jargon** (Strategy, Statistics, Solver, …)
- [ ] Validation errors are **inline** per field
- [ ] Decision screen shows **only 3 numbers** + status line + single CTA
- [ ] Optional bankroll shows **feasibility hint** when entered
- [ ] **View Plan** opens round table; back navigation works
- [ ] Product code imports **only** `@stake/constraint-engine`
- [ ] Dogfood: no “ủa tiếp theo bấm gì?” after Generate

---

## Implementation notes (for step 3)

| UI label | SDK source |
| -------- | ---------- |
| Vốn cần | `statistics.requiredBankrollAmount` |
| Lợi nhuận mục tiêu | `statistics.expectedProfitAmount` |
| Cược lớn nhất | `statistics.maximumBetAmount` |
| Bảng vòng | `strategy.rounds[]` — `betAmount`, `accumulatedSpent` |
| Validation | `validateCalculationRequest` → map `error.path` to fields |

Keep state local (React `useState`). No router required for three screens — simple step enum is enough.

---

## After Feature 1

Feature 2 **Improve Plan** adds budget input on Result + optimize flow when bankroll insufficient.
