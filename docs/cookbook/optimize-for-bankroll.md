# Optimize for Bankroll

Use when **required bankroll exceeds the user's budget** (RFC-102: Optimize → Suggested Plan).

```typescript
import {
  OptimizationReasons,
  buildStatistics,
  buildStrategy,
  optimize,
  solve,
  validateCalculationRequest,
} from '@stake/constraint-engine';

import type { CalculationRequest } from '@stake/constraint-engine';

const intent: CalculationRequest = {
  rewardMultiplier: 20,
  roundCount: 50,
  minimumBet: 10_000,
  betStep: 1_000,
  targetProfit: { mode: 'fixedAmount', amount: 100_000 },
};

const bankrollLimit = 1_000_000;
const profitGranularity = 5_000;

const result = optimize({
  intent,
  bankrollLimit,
  allowRoundReduction: true,
  profitGranularity,
});

if (result.kind === 'failure') {
  // result.code === 'NO_FEASIBLE_SOLUTION' — see error-codes.md
  throw result;
}

const { request: suggested, explanation } = result;

// UI composes human copy from structured fields (not from Core messages)
if (explanation.reason === OptimizationReasons.PROFIT_REDUCED) {
  console.log(`Profit reduced by ${explanation.profitReducedBy}`);
}

// Re-run generate pipeline on the suggested plan
const validated = validateCalculationRequest(suggested);
const solved = solve(validated.value!);
const strategy = buildStrategy(solved.value!.rounds);
const statistics = buildStatistics(strategy);

console.log('Suggested required bankroll:', statistics.requiredBankrollAmount);
```

**`allowRoundReduction: false`** — profit-only search; may return `NO_FEASIBLE_SOLUTION` if profit reduction alone is not enough.

**Next:** [Run simulation](run-simulation.md) on the suggested plan.
