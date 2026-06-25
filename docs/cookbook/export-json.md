# Export JSON

Use when the user saves or shares a plan. The SDK has no separate export function — **serialize public types** after Generate.

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
const solved = solve(validated.value!);
const strategy = buildStrategy(solved.value!.rounds);
const statistics = buildStatistics(strategy);

const exportPayload = {
  version: 1,
  request,
  strategy: {
    rounds: strategy.rounds.map((r) => ({
      index: r.index,
      betAmount: r.betAmount,
      rewardAmount: r.rewardAmount,
      accumulatedSpent: r.accumulatedSpent,
    })),
  },
  statistics: {
    requiredBankrollAmount: statistics.requiredBankrollAmount,
    averageBetAmount: statistics.averageBetAmount,
    expectedProfitAmount: statistics.expectedProfitAmount,
  },
};

const json = JSON.stringify(exportPayload, null, 2);
// write to file, clipboard, or API
console.log(json);
```

**Schema:** Owned by your app — add `version` and migrate on your side. Re-import by passing `request` back through Generate.
