# Run Simulation

Use after Generate or Optimize to show a **deterministic win-at-round** scenario (RFC-102: Simulation before Export).

```typescript
import {
  buildStatistics,
  buildStrategy,
  simulateWinAtRound,
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

const winAtRound = 3;
const simulation = simulateWinAtRound(strategy, winAtRound);

if (simulation.kind === 'failure') {
  // EMPTY_STRATEGY | WIN_ROUND_NOT_INTEGER | WIN_ROUND_OUT_OF_RANGE
  throw simulation.error;
}

const { winningRoundIndex, profitAmount, requiredBankrollAmount, rounds } = simulation.value;

console.log(`Win at round ${winningRoundIndex}`);
console.log(`Scenario profit: ${profitAmount}`);
console.log(`Bankroll needed at win: ${requiredBankrollAmount}`);
// rounds[] — per-round bet, result (Lose | Win | NotPlayed), accumulatedSpent
```

**UI responsibility:** Turn numbers into trust-building copy (“If you win at round 3, profit is …”). The engine returns facts, not narratives.

**Next:** [Export JSON](export-json.md).
