# Stake Planner — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2025-06-25

---

## 1. Executive Summary

Stake Planner is a professional bankroll planning application designed for users who participate in fixed-payout betting systems such as Bingo18, Keno, lottery-style games, and similar formats where the payout multiplier is known in advance.

**Critical disclaimer:** This software does NOT predict gambling outcomes. It does NOT claim to increase winning probability. It is purely a mathematical optimizer that distributes bankroll across rounds according to user-defined constraints.

The primary objective is to help users understand **how much bankroll they need** and **what bet sequence satisfies their profit targets** — nothing more.

---

## 2. Problem Statement

Users who employ progressive or structured staking strategies face several challenges:

1. **Manual calculation is error-prone.** Rounding rules, bet increments, and cumulative spend make spreadsheet calculations fragile.
2. **Bankroll underestimation leads to ruin.** Without knowing the minimum required bankroll, users may run out of funds before reaching their target round.
3. **Profit targets vary.** Some users want break-even recovery; others want fixed or percentage profit after N rounds.
4. **No single tool serves all fixed-payout systems.** Bingo18, Keno, and lottery variants share the same mathematical structure but lack a unified planning tool.

Stake Planner solves these problems with a deterministic calculation engine and a clear, honest user interface.

---

## 3. Goals and Non-Goals

### 3.1 Goals

| ID  | Goal                                              | Success Metric                                    |
| --- | ------------------------------------------------- | ------------------------------------------------- |
| G1  | Calculate optimal bet per round given constraints | 100% match with algorithms.md for all test cases  |
| G2  | Determine minimum bankroll for N rounds           | User can see total spend before round N           |
| G3  | Support multiple profit modes                     | Break Even, Fixed Profit, Percentage Profit       |
| G4  | Work across fixed-payout systems                  | Same engine for Bingo18, Keno, Lottery            |
| G5  | Remain fully deterministic                        | Identical inputs always produce identical outputs |
| G6  | Provide exportable plans                          | CSV/PDF export in Phase 4                         |

### 3.2 Non-Goals

| ID  | Non-Goal                                     | Reason                                     |
| --- | -------------------------------------------- | ------------------------------------------ |
| NG1 | Predict win/loss outcomes                    | Mathematically impossible; ethically wrong |
| NG2 | Suggest strategies increase win rate         | Violates product philosophy                |
| NG3 | Connect to gambling platforms                | Out of scope; regulatory risk              |
| NG4 | Store user financial data in cloud (Phase 1) | Privacy; local-first approach              |
| NG5 | Real-time odds fetching                      | Not applicable to fixed-payout systems     |

---

## 4. Target Users

### 4.1 Primary Persona: Structured Bettor

- Participates in Bingo18, Keno, or similar fixed-payout games
- Uses progressive staking (e.g., Martingale variants, custom recovery plans)
- Needs to know exact bankroll requirements before starting
- Comfortable with numbers but wants automation

### 4.2 Secondary Persona: Strategy Analyst

- Tests staking plans hypothetically
- Compares profit modes and round counts
- Uses export features for documentation

### 4.3 Tertiary Persona: Developer Integrator

- Embeds calculation engine in own tools
- Uses core library without UI (Node, React Native)

---

## 5. User Inputs

All user-facing inputs map directly to business-rules.md.

| Input                    | Type             | Validation                                      | Description                                  |
| ------------------------ | ---------------- | ----------------------------------------------- | -------------------------------------------- |
| Reward Multiplier        | Positive number  | > 0                                             | Payout ratio: Reward = Bet × Multiplier      |
| Minimum Bet              | Positive integer | ≥ 1, multiple of Bet Increment                  | Floor bet amount                             |
| Bet Increment (Bet Step) | Positive integer | ≥ 1                                             | All bets must be multiples of this value     |
| Number of Rounds         | Positive integer | ≥ 1                                             | How many betting rounds to plan              |
| Profit Mode              | Enum             | Break Even \| Fixed Profit \| Percentage Profit | Determines desired profit calculation        |
| Target Profit            | Number           | ≥ 0 (mode-dependent)                            | Fixed amount or percentage depending on mode |

### 5.1 Profit Mode Definitions

**Break Even**

After winning at round N, net profit equals zero. User recovers all prior losses.

```
desiredProfit = 0 (relative to totalSpent at each round)
```

**Fixed Profit**

After winning at round N, user achieves a fixed monetary profit on top of break-even.

```
desiredProfit = Target Profit (fixed amount)
```

**Percentage Profit**

After winning at round N, user achieves profit equal to a percentage of total spent.

```
desiredProfit = totalSpent × (Target Profit / 100)
```

---

## 6. Core Algorithm

The calculation engine follows algorithms.md exactly. Summary:

For each round `i` from 1 to N:

1. Compute `requiredReturn = totalSpent + desiredProfit`
2. Compute `requiredBet = requiredReturn / rewardMultiplier`
3. Compute `bet = ceil(requiredBet / betStep) × betStep`
4. If `bet < minimumBet`, set `bet = minimumBet`
5. Compute `reward = bet × rewardMultiplier`
6. Update `totalSpent += bet`
7. Compute `profit = reward - totalSpent`
8. Compute `ROI = profit / totalSpent`
9. Store round record: Round, Bet, Reward, Spent, Profit, ROI

### 6.1 Rounding Rules

- **Always round UP** (ceiling), never down
- **Always align to Bet Step** (multiple of increment)
- **Never below Minimum Bet**

These rules are non-negotiable. See DECISIONS.md for rationale.

---

## 7. Outputs

### 7.1 Per-Round Table

| Column | Description                                   |
| ------ | --------------------------------------------- |
| Round  | Round number (1-indexed)                      |
| Bet    | Recommended bet for this round                |
| Reward | Potential reward if win occurs this round     |
| Spent  | Cumulative total spent through this round     |
| Profit | Net profit if win occurs this round           |
| ROI    | Return on investment if win occurs this round |

### 7.2 Summary Metrics

| Metric                  | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| Total Bankroll Required | Sum of all bets through round N (worst case: lose every round) |
| Max Single Bet          | Largest bet in the plan                                        |
| Final Round Profit      | Profit if win occurs on round N                                |
| Final Round ROI         | ROI if win occurs on round N                                   |

---

## 8. Functional Requirements

### 8.1 Phase 1 — Calculation Engine

| ID     | Requirement                                            | Priority |
| ------ | ------------------------------------------------------ | -------- |
| FR-1.1 | Implement `calculateStrategy()` pure function          | P0       |
| FR-1.2 | Define `StrategyInput` and `StrategyResult` interfaces | P0       |
| FR-1.3 | Support all three profit modes                         | P0       |
| FR-1.4 | Unit tests for every public function                   | P0       |
| FR-1.5 | JSDoc on every exported function                       | P0       |
| FR-1.6 | Integer-safe arithmetic where possible                 | P1       |

### 8.2 Phase 2 — User Interface

| ID     | Requirement                                | Priority |
| ------ | ------------------------------------------ | -------- |
| FR-2.1 | Input form for all user parameters         | P0       |
| FR-2.2 | Results table with all round data          | P0       |
| FR-2.3 | Summary metrics panel                      | P0       |
| FR-2.4 | Input validation with clear error messages | P0       |
| FR-2.5 | Responsive layout (mobile + desktop)       | P1       |
| FR-2.6 | Dark/light theme                           | P2       |

### 8.3 Phase 3 — Simulator

| ID     | Requirement                                        | Priority |
| ------ | -------------------------------------------------- | -------- |
| FR-3.1 | Simulate win at any round                          | P1       |
| FR-3.2 | Show bankroll depletion path on consecutive losses | P1       |
| FR-3.3 | Compare multiple profit modes side-by-side         | P2       |

### 8.4 Phase 4 — Export

| ID     | Requirement             | Priority |
| ------ | ----------------------- | -------- |
| FR-4.1 | Export plan to CSV      | P1       |
| FR-4.2 | Export plan to PDF      | P2       |
| FR-4.3 | Copy table to clipboard | P2       |

### 8.5 Phase 5 — Optimization

| ID     | Requirement                                       | Priority |
| ------ | ------------------------------------------------- | -------- |
| FR-5.1 | Find minimum bankroll for target profit           | P1       |
| FR-5.2 | Find optimal round count for given bankroll       | P2       |
| FR-5.3 | Document mathematical proof before implementation | P0       |

---

## 9. Non-Functional Requirements

| ID    | Category        | Requirement                                      |
| ----- | --------------- | ------------------------------------------------ |
| NFR-1 | Performance     | Calculate 1000-round plan in < 100ms             |
| NFR-2 | Determinism     | Same input → same output, always                 |
| NFR-3 | Testability     | Core engine runs without React                   |
| NFR-4 | Maintainability | No component > 200 lines; no function > 60 lines |
| NFR-5 | Type Safety     | Strict TypeScript, no `any`                      |
| NFR-6 | Accessibility   | WCAG 2.1 AA for UI (Phase 2)                     |
| NFR-7 | Privacy         | No data sent to server in Phase 1–3              |

---

## 10. Architecture Overview

```
┌─────────────────────────────────────┐
│              UI Layer               │
│   (React Components — render only)  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│         Application Layer           │
│   (Hooks, state, form validation)   │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│       Calculation Engine            │
│   src/core — framework independent  │
│   calculateStrategy(), types, utils │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│            Utilities                │
│   Rounding, validation, formatting  │
└─────────────────────────────────────┘
```

See architecture.md and DECISIONS.md for detailed rationale.

---

## 11. Data Models

### 11.1 StrategyInput

```typescript
interface StrategyInput {
  rewardMultiplier: number;
  minimumBet: number;
  betStep: number;
  numberOfRounds: number;
  profitMode: 'break-even' | 'fixed-profit' | 'percentage-profit';
  targetProfit: number;
}
```

### 11.2 RoundResult

```typescript
interface RoundResult {
  round: number;
  bet: number;
  reward: number;
  spent: number;
  profit: number;
  roi: number;
}
```

### 11.3 StrategyResult

```typescript
interface StrategyResult {
  rounds: RoundResult[];
  summary: {
    totalBankrollRequired: number;
    maxSingleBet: number;
    finalRoundProfit: number;
    finalRoundRoi: number;
  };
}
```

---

## 12. User Flows

### 12.1 Primary Flow: Generate Staking Plan

1. User opens application
2. User enters Reward Multiplier, Minimum Bet, Bet Step, Number of Rounds
3. User selects Profit Mode and enters Target Profit (if applicable)
4. User clicks "Calculate"
5. System validates inputs
6. System runs `calculateStrategy()`
7. System displays round-by-round table and summary
8. User reviews bankroll requirement

### 12.2 Error Flow: Invalid Input

1. User enters invalid value (e.g., Bet Step = 0)
2. System displays inline validation error
3. Calculate button disabled until fixed
4. No calculation runs with invalid input

---

## 13. Legal and Ethical Constraints

1. **No win prediction.** All copy must avoid language implying increased win probability.
2. **Disclaimer required.** UI must display: "This tool calculates bankroll distribution only. It does not predict outcomes."
3. **No affiliate links** to gambling platforms without explicit legal review.
4. **Age gate** (optional, Phase 2): Consider 18+ warning for gambling-adjacent content.

---

## 14. Testing Strategy

| Layer       | Tool                     | Coverage Target       |
| ----------- | ------------------------ | --------------------- |
| Core engine | Vitest                   | 100% public functions |
| Application | Vitest + Testing Library | Critical paths        |
| E2E         | Playwright (Phase 2)     | Primary user flow     |

### 14.1 Required Test Cases (Engine)

- Break even, 1 round, minimum bet only
- Fixed profit with known spreadsheet values
- Percentage profit at round 5, 10, 20
- Bet rounding up (requiredBet not multiple of step)
- Bet floor at minimumBet
- Large round counts (100, 1000) — performance + correctness
- Edge: multiplier = 1, minimumBet = betStep

---

## 15. Release Plan

See ROADMAP.md for phase breakdown.

| Phase | Deliverable         | Exit Criteria                             |
| ----- | ------------------- | ----------------------------------------- |
| 1     | Core engine + tests | All FR-1.x pass; progress.md updated      |
| 2     | React UI            | Primary user flow works end-to-end        |
| 3     | Simulator           | Win-at-round-N visualization              |
| 4     | Export              | CSV download works                        |
| 5     | Optimization        | Min bankroll finder with documented proof |

---

## 16. Open Questions

| ID   | Question                      | Owner       | Status                        |
| ---- | ----------------------------- | ----------- | ----------------------------- |
| OQ-1 | Support decimal bet steps?    | Product     | Open — currently integer only |
| OQ-2 | Localization (Vietnamese UI)? | Product     | Open                          |
| OQ-3 | PWA offline support?          | Engineering | Deferred to Phase 2           |

---

## 17. Glossary

| Term              | Definition                                                  |
| ----------------- | ----------------------------------------------------------- |
| Bankroll          | Total funds available for the staking plan                  |
| Bet Step          | Minimum increment between valid bet amounts                 |
| Reward Multiplier | Factor applied to bet to compute reward on win              |
| ROI               | (Profit / Total Spent) × 100% conceptually; stored as ratio |
| Round             | One betting opportunity; user may lose and proceed to next  |
| Total Spent       | Cumulative sum of all bets through current round            |

---

## 18. References

- `.memory-bank/project.md` — Project identity
- `.memory-bank/architecture.md` — Technical architecture
- `.memory-bank/business-rules.md` — Business rules (authoritative)
- `.memory-bank/algorithms.md` — Calculation algorithm (authoritative)
- `.memory-bank/coding-rules.md` — Code standards
- `DECISIONS.md` — Architecture decision records
- `ROADMAP.md` — Phase timeline

---

_This document is the product source of truth. When requirements conflict with implementation, business-rules.md overrides all._
