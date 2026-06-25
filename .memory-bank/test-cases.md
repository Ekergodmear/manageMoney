# Test Cases

Authoritative test specifications for the calculation engine.
Every case must become at least one unit test.

Reference: `examples.md` for full expected tables where noted.

---

## Case 1 — Fixed Profit Stability

**Purpose:** Verify profit constraint holds across many rounds.

| Input             | Value        |
| ----------------- | ------------ |
| Reward Multiplier | 20           |
| Minimum Bet       | 10,000       |
| Bet Step          | 1,000        |
| Number of Rounds  | 10           |
| Profit Mode       | Fixed Profit |
| Target Profit     | 100,000      |

**Expected:**

- Every round: `profit >= 100,000`
- Round 10 profit exactly `100,000` (minimum constraint tightens)
- Total capital = sum of all bets = `100,000`

**Maps to:** `examples.md` Example 1 (extended to 10 rounds)

---

## Case 2 — Break Even Long Plan

**Purpose:** Large round count without error.

| Input             | Value      |
| ----------------- | ---------- |
| Reward Multiplier | 40         |
| Minimum Bet       | 10,000     |
| Bet Step          | 10,000     |
| Number of Rounds  | 100        |
| Profit Mode       | Break Even |
| Target Profit     | 0          |

**Expected:**

- No throw
- Every round: `profit >= 0`
- `rounds.length === 100`
- All bets are multiples of 10,000
- All bets >= 10,000

---

## Case 3 — Minimum Bet Equals Step

**Purpose:** Bet step alignment when min equals step.

| Input             | Value        |
| ----------------- | ------------ |
| Reward Multiplier | 20           |
| Minimum Bet       | 5,000        |
| Bet Step          | 5,000        |
| Number of Rounds  | 3            |
| Profit Mode       | Fixed Profit |
| Target Profit     | 100,000      |

**Expected:**

- Exact match with `examples.md` Example 3
- Every bet is multiple of 5,000

---

## Case 4 — Invalid Multiplier Zero

**Purpose:** Validation rejects impossible multiplier.

| Input             | Value        |
| ----------------- | ------------ |
| Reward Multiplier | 0            |
| Minimum Bet       | 10,000       |
| Bet Step          | 1,000        |
| Number of Rounds  | 5            |
| Profit Mode       | Fixed Profit |
| Target Profit     | 100,000      |

**Expected:**

- `validateStrategyInput()` returns `{ ok: false, error }` with field `rewardMultiplier`
- `solve()` / `generateStrategy()` never called with invalid input in happy-path tests

---

## Case 5 — Negative Rounds

**Purpose:** Reject invalid round count.

| Input             | Value      |
| ----------------- | ---------- |
| Reward Multiplier | 20         |
| Minimum Bet       | 10,000     |
| Bet Step          | 1,000      |
| Number of Rounds  | -1         |
| Profit Mode       | Break Even |
| Target Profit     | 0          |

**Expected:**

- Throws `StrategyValidationError`
- Field: `numberOfRounds`

---

## Case 6 — Large Values No Overflow

**Purpose:** Integer safety at scale.

| Input             | Value         |
| ----------------- | ------------- |
| Reward Multiplier | 20            |
| Minimum Bet       | 1,000,000     |
| Bet Step          | 1,000,000     |
| Number of Rounds  | 50            |
| Profit Mode       | Fixed Profit  |
| Target Profit     | 1,000,000,000 |

**Expected:**

- No throw
- No `Infinity` or `NaN` in any field
- All monetary values remain finite integers
- Last round `spent` <= safe integer range (Number.MAX_SAFE_INTEGER)

---

## Case 7 — Minimum Bet Not Multiple of Step

**Purpose:** Validation catches misconfigured input.

| Input             | Value      |
| ----------------- | ---------- |
| Reward Multiplier | 20         |
| Minimum Bet       | 10,500     |
| Bet Step          | 1,000      |
| Number of Rounds  | 5          |
| Profit Mode       | Break Even |
| Target Profit     | 0          |

**Expected:**

- Throws `StrategyValidationError`
- Field: `minimumBet`

---

## Case 8 — Bet Ceiling Rounding

**Purpose:** Verify ceil-to-step, never floor.

| Input             | Value      |
| ----------------- | ---------- |
| Reward Multiplier | 20         |
| Minimum Bet       | 1,000      |
| Bet Step          | 1,000      |
| Number of Rounds  | 2          |
| Profit Mode       | Break Even |
| Target Profit     | 0          |

**Round 2 manual check:**

```
After round 1: totalSpent = 1,000
requiredReturn = 1,000
requiredBet = 50
bet = ceil(50/1000) × 1000 = 1,000  (NOT 0, NOT floor to 0)
```

**Expected:**

- Round 2 bet = 1,000
- Reward >= totalSpent (break even satisfied)

---

## Case 9 — Percentage Profit Mode

**Purpose:** Percentage desired profit formula.

| Input             | Value             |
| ----------------- | ----------------- |
| Reward Multiplier | 20                |
| Minimum Bet       | 10,000            |
| Bet Step          | 1,000             |
| Number of Rounds  | 3                 |
| Profit Mode       | Percentage Profit |
| Target Profit     | 10                |

**Expected:**

- Match `examples.md` Example 5
- Round 2+: `profit >= totalSpent_before × 0.10` at time of win

---

## Case 10 — Stress Test (100,000 rounds)

**Purpose:** Performance and integer safety at extreme scale.

| Input             | Value      |
| ----------------- | ---------- |
| Reward Multiplier | 100,000    |
| Minimum Bet       | 1          |
| Bet Step          | 1          |
| Number of Rounds  | 100,000    |
| Profit Mode       | Break Even |
| Target Profit     | 0          |

**Expected:**

- Completes without timeout (< 5s in test env)
- No throw, no `Infinity`, no `NaN`
- `rounds.length === 100_000`
- All invariants hold on first, middle (round 50,000), and last round
- Spent on last round ≤ `Number.MAX_SAFE_INTEGER`
- Benchmark: see `benchmarks/README.md`

**QA:** Malicious variant — same but `numberOfRounds: 1_000_000` should reject or complete with documented limit.

---

## Test Implementation Rules

1. One `describe` block per case minimum
2. Use exact integers — no approximate matchers for money
3. Invalid input cases must assert error type AND field
4. Add regression test for every bug found in review
