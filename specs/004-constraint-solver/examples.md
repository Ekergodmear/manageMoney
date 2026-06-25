# Spec 004 — Examples

## Manual calc scenario (Round 3)

| Field         | Value        |
| ------------- | ------------ |
| Multiplier    | 20           |
| Rounds        | 50           |
| Profit mode   | fixed-profit |
| Target profit | 100,000      |
| Min bet       | 10,000       |
| Step          | 1,000        |

Round 1 hand calc:

```
desiredProfit = 100,000
totalSpent = 0
requiredReturn = 100,000
requiredBet = 100,000 / 20 = 5,000
bet = ceil(5,000 / 1,000) × 1,000 = 5,000 → min 10,000 → bet = 10,000
```

Continue through round 50 — document all bets in Round 3 deliverable.

## Fixture reference

`tests/fixtures/fixed-profit-x20-5-rounds.json` — 5-round subset for automated tests after Round 4.
