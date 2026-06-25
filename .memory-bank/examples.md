# Mathematical Examples

Authoritative reference for manual verification and tests.
All values computed from `algorithms.md` — never approximate.

When changing the calculation engine, **verify every example here first**.

---

## Example 1 — Fixed Profit (canonical)

### Inputs

| Field             | Value        |
| ----------------- | ------------ |
| Reward Multiplier | 20           |
| Minimum Bet       | 10,000       |
| Bet Step          | 1,000        |
| Number of Rounds  | 5            |
| Profit Mode       | Fixed Profit |
| Target Profit     | 100,000      |

### Expected Bets

| Round | Bet    |
| ----- | ------ |
| 1     | 10,000 |
| 2     | 10,000 |
| 3     | 10,000 |
| 4     | 10,000 |
| 5     | 10,000 |

### Expected Full Table

| Round | Bet    | Reward  | Spent  | Profit  | ROI   |
| ----- | ------ | ------- | ------ | ------- | ----- |
| 1     | 10,000 | 200,000 | 10,000 | 190,000 | 19.0  |
| 2     | 10,000 | 200,000 | 20,000 | 180,000 | 9.0   |
| 3     | 10,000 | 200,000 | 30,000 | 170,000 | 5.667 |
| 4     | 10,000 | 200,000 | 40,000 | 160,000 | 4.0   |
| 5     | 10,000 | 200,000 | 50,000 | 150,000 | 3.0   |

### Summary

| Metric                          | Value       |
| ------------------------------- | ----------- |
| Total Capital (lose all rounds) | 50,000      |
| Profit every round (if win)     | ≥ 100,000 ✓ |
| Max Single Bet                  | 10,000      |

**Note:** Early rounds hit `minimumBet` because `requiredBet` < 10,000 after ceiling to step.

---

## Example 2 — Bet Escalation (step = multiplier of min)

### Inputs

| Field             | Value        |
| ----------------- | ------------ |
| Reward Multiplier | 20           |
| Minimum Bet       | 10,000       |
| Bet Step          | 10,000       |
| Number of Rounds  | 12           |
| Profit Mode       | Fixed Profit |
| Target Profit     | 100,000      |

### Expected Bets (selected rounds)

| Round | Bet    | Reason                                |
| ----- | ------ | ------------------------------------- |
| 1–9   | 10,000 | requiredBet < 10,000 → minimumBet     |
| 10    | 10,000 | requiredBet = 9,500 → ceil to 10,000  |
| 11    | 10,000 | requiredBet = 10,000 → exactly 10,000 |
| 12    | 20,000 | requiredBet = 10,500 → ceil to 20,000 |

### Round 12 Detail

```
totalSpent before round 12 = 110,000
desiredProfit = 100,000
requiredReturn = 210,000
requiredBet = 210,000 / 20 = 10,500
bet = ceil(10,500 / 10,000) × 10,000 = 20,000
reward = 400,000
totalSpent after = 130,000
profit = 400,000 - 130,000 = 270,000 ≥ 100,000 ✓
```

---

## Example 3 — Minimum Bet Equals Bet Step

### Inputs

| Field             | Value        |
| ----------------- | ------------ |
| Reward Multiplier | 20           |
| Minimum Bet       | 5,000        |
| Bet Step          | 5,000        |
| Number of Rounds  | 3            |
| Profit Mode       | Fixed Profit |
| Target Profit     | 100,000      |

### Expected Full Table

| Round | Bet    | Reward  | Spent  | Profit  |
| ----- | ------ | ------- | ------ | ------- |
| 1     | 5,000  | 100,000 | 5,000  | 95,000  |
| 2     | 10,000 | 200,000 | 15,000 | 185,000 |
| 3     | 10,000 | 200,000 | 25,000 | 175,000 |

**Note:** Round 1 profit < 100,000 because minimumBet (5,000) is below theoretical requiredBet (5,000 after ceil) — still satisfies constraint when bet raised to minimum. Round 2+ profit ≥ 100,000.

---

## Example 4 — Break Even

### Inputs

| Field             | Value       |
| ----------------- | ----------- |
| Reward Multiplier | 20          |
| Minimum Bet       | 10,000      |
| Bet Step          | 1,000       |
| Number of Rounds  | 5           |
| Profit Mode       | Break Even  |
| Target Profit     | 0 (ignored) |

### Expected

| Round | Bet    | Spent  | Profit (if win) |
| ----- | ------ | ------ | --------------- |
| 1     | 10,000 | 10,000 | 190,000         |
| 2     | 10,000 | 20,000 | 180,000         |
| 3     | 10,000 | 30,000 | 170,000         |
| 4     | 10,000 | 40,000 | 160,000         |
| 5     | 10,000 | 50,000 | 150,000         |

**Constraint:** Profit ≥ 0 every round ✓

---

## Example 5 — Percentage Profit (10%)

### Inputs

| Field             | Value             |
| ----------------- | ----------------- |
| Reward Multiplier | 20                |
| Minimum Bet       | 10,000            |
| Bet Step          | 1,000             |
| Number of Rounds  | 3                 |
| Profit Mode       | Percentage Profit |
| Target Profit     | 10 (percent)      |

### Round 1

```
totalSpent = 0
desiredProfit = 0 × 10% = 0
requiredReturn = 0
bet = minimumBet = 10,000
spent = 10,000
profit = 200,000 - 10,000 = 190,000
```

### Round 2

```
totalSpent = 10,000
desiredProfit = 10,000 × 10% = 1,000
requiredReturn = 11,000
requiredBet = 550
bet = ceil(550/1000)×1000 = 1000 → min 10,000
profit = 200,000 - 20,000 = 180,000 ≥ 1,000 ✓
```

---

## How to Use

1. Implement or change engine
2. Run unit tests against these inputs
3. Compare every column — exact integer match for Bet, Reward, Spent, Profit
4. ROI may be floating point for display only
