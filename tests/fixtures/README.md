# Test Fixtures

Golden JSON inputs + expected outputs for stable tests.

**Rule:** Tests load fixtures from here — do not hardcode values in test files when a fixture exists.

---

## Files

| Fixture                          | Source            | Purpose                |
| -------------------------------- | ----------------- | ---------------------- |
| `fixed-profit-x20-5-rounds.json` | examples.md Ex1   | Canonical 5-round plan |
| `break-even-x20-5-rounds.json`   | examples.md Ex4   | Break even mode        |
| `x20-10-rounds.json`             | test-cases Case 1 | 10-round profit floor  |
| `x40-100-rounds.json`            | test-cases Case 2 | Long plan stability    |
| `min-bet-equals-step.json`       | test-cases Case 3 | Step alignment         |

---

## Legacy format note (Sprint 2.1B)

Fixtures currently use **legacy** field names (`numberOfRounds`, `profitMode`, flat `targetProfit`).

Sprint 2.2+ will add a mapper to `CalculationRequest` or migrate fixtures to:

```json
{
  "roundCount": 5,
  "targetProfit": { "mode": "breakEven" }
}
```

Do not change fixture math values when migrating — only shape.

```typescript
import fixedProfit from '../fixtures/fixed-profit-x20-5-rounds.json';
const result = generateStrategy(fixedProfit.input);
// assert against fixedProfit.expected
```

---

## Adding Fixtures

1. Compute expected values from `algorithms.md` manually
2. Cross-check with `examples.md`
3. One fixture per test case minimum for regression
