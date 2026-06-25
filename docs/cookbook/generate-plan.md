# Generate a Plan

Use when the user submits inputs and you need **required bankroll** and round-by-round bets.

```typescript
import {
  buildStatistics,
  buildStrategy,
  solve,
  validateCalculationRequest,
} from '@stake/constraint-engine';

import type { CalculationRequest } from '@stake/constraint-engine';

const request: CalculationRequest = {
  rewardMultiplier: 20,
  roundCount: 5,
  minimumBet: 10_000,
  betStep: 1_000,
  targetProfit: { mode: 'fixedAmount', amount: 100_000 },
};

const validated = validateCalculationRequest(request);
if (validated.kind === 'failure') {
  // Map validated.error.errors → form fields (see error-codes.md)
  throw validated.error;
}

const solved = solve(validated.value);
if (solved.kind === 'failure') {
  throw new Error('solver failed on valid input');
}

const strategy = buildStrategy(solved.value.rounds);
const statistics = buildStatistics(strategy);

// UI: show statistics.requiredBankrollAmount, strategy.rounds, etc.
console.log('Required bankroll:', statistics.requiredBankrollAmount);
```

**Tip:** Apps repeat this four-step chain. A local `runPipeline(request)` helper (as in `examples/minimal-consumer`) keeps screens DRY until a future high-level `generatePlan()` is added.

**Next:** If `requiredBankrollAmount > userBudget` → [Optimize for bankroll](optimize-for-bankroll.md).
