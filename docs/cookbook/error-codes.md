# Error Cookbook

Core returns **stable codes**, not UI copy. Your app maps codes → message → suggested action.

---

## Validation (`validateCalculationRequest`)

On `result.kind === 'failure'`, iterate `result.error.errors`. Each error has `code`, `message`, `path`, `layer`.

| Code          | Field (`path`)             | Suggested UI message                 | Suggested action                  |
| ------------- | -------------------------- | ------------------------------------ | --------------------------------- |
| `S001`        | (root)                     | Invalid request shape                | Check all required fields         |
| `S002`–`S005` | multiplier / rounds / bets | Value must be a number               | Fix numeric input                 |
| `S006`        | `targetProfit`             | Invalid profit target                | Choose fixed amount or percentage |
| `S007`–`S009` | rounds / bets              | Must be whole numbers                | Remove decimals                   |
| `S010`–`S012` | profit fields              | Invalid profit value                 | Fix profit input                  |
| `B001`        | `rewardMultiplier`         | Multiplier too low                   | Increase reward multiplier        |
| `B002`        | `roundCount`               | Too few rounds                       | Increase round count              |
| `B003`        | `minimumBet`               | Minimum bet too low                  | Increase minimum bet              |
| `B004`        | `betStep`                  | Bet step too low                     | Increase bet step                 |
| `B005`        | `minimumBet` / `betStep`   | Bet step does not divide minimum bet | Align step with minimum           |
| `B006`        | `targetProfit.amount`      | Profit cannot be negative            | Enter a positive amount           |
| `B007`        | `targetProfit.percentage`  | Percentage cannot be negative        | Enter a positive percentage       |
| `B008`        | `targetProfit.percentage`  | Percentage too high                  | Lower the percentage              |
| `M001`        | (varies)                   | Value too large                      | Reduce input magnitude            |
| `M002`        | (solver)                   | Plan too large to compute safely     | Reduce rounds or profit           |

Use `ValidationCodes` from the package for `switch` statements:

```typescript
import { ValidationCodes } from '@stake/constraint-engine';

if (err.code === ValidationCodes.B002_ROUND_COUNT_TOO_LOW) {
  // highlight roundCount field
}
```

---

## Optimization (`optimize`)

| Code / reason               | When                        | Suggested UI message               | Suggested action                                       |
| --------------------------- | --------------------------- | ---------------------------------- | ------------------------------------------------------ |
| `NO_FEASIBLE_SOLUTION`      | `result.kind === 'failure'` | No plan fits your budget           | Lower profit, add rounds reduction, or increase budget |
| `IDENTITY`                  | Plan already fits           | (no optimize UI needed)            | Show original Generate result                          |
| `PROFIT_REDUCED`            | Lower profit fits           | Target profit was reduced          | Show `profitReducedBy`; offer “Use this plan”          |
| `ROUNDS_REDUCED`            | Fewer rounds fits           | Round count was reduced            | Show `roundsReducedBy`                                 |
| `PROFIT_AND_ROUNDS_REDUCED` | Both adjusted               | Plan adjusted on profit and rounds | Show both deltas                                       |

Compose narrative in UI — example:

```text
Your budget: 1,000,000
Original plan needs: 1,520,000
Suggested profit target: 5,000 (reduced by 95,000)
```

Fields: `explanation.reason`, `explanation.profitReducedBy`, `explanation.roundsReducedBy`, plus your own `bankrollLimit` and original `requiredBankrollAmount`.

---

## Simulation (`simulateWinAtRound`)

| Code                     | When           | Suggested UI message         | Suggested action      |
| ------------------------ | -------------- | ---------------------------- | --------------------- |
| `EMPTY_STRATEGY`         | No rounds      | No plan to simulate          | Generate a plan first |
| `WIN_ROUND_NOT_INTEGER`  | Bad input      | Round must be a whole number | Fix round picker      |
| `WIN_ROUND_OUT_OF_RANGE` | Round ∉ [1, N] | Round out of range           | Pick 1 … roundCount   |

---

## Solver (`solve`)

On valid input, `solve` does not fail (`SolverError` is `never`). If you see failure, the request was not validated — call `validateCalculationRequest` first.
