/**
 * Minimal consumer — imports only from published package entry.
 */
import {
  ValidationCodes,
  buildStatistics,
  buildStrategy,
  simulateWinAtRound,
  solve,
  validateCalculationRequest,
} from '@stake/constraint-engine';

const request = {
  rewardMultiplier: 20,
  roundCount: 5,
  minimumBet: 10_000,
  betStep: 1_000,
  targetProfit: { mode: 'fixedAmount', amount: 100_000 },
};

const validated = validateCalculationRequest(request);
if (validated.kind !== 'success') {
  throw new Error('validation failed');
}

const solved = solve(validated.value);
if (solved.kind !== 'success') {
  throw new Error('solve failed');
}

const strategy = buildStrategy(solved.value.rounds);
const statistics = buildStatistics(strategy);
const simulation = simulateWinAtRound(strategy, 3);

if (simulation.kind !== 'success') {
  throw new Error('simulation failed');
}

if (!Object.isFrozen(ValidationCodes)) {
  throw new Error('ValidationCodes must be frozen');
}

if (statistics.requiredBankrollAmount <= 0) {
  throw new Error('unexpected statistics');
}

if (simulation.value.winningRoundIndex !== 3) {
  throw new Error('unexpected winning round');
}

console.log('consumer smoke ok');
