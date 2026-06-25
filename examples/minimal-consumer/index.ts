/**
 * Sprint 3.6 — Consumer Validation
 *
 * Proof that @stake/constraint-engine alone supports a full product workflow.
 * Imports ONLY from the published package entry — no deep imports.
 */

import {
  OptimizationReasons,
  buildStatistics,
  buildStrategy,
  optimize,
  simulateWinAtRound,
  solve,
  validateCalculationRequest,
} from '@stake/constraint-engine';

import type { CalculationRequest } from '@stake/constraint-engine';

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US');
}

function runPipeline(request: CalculationRequest) {
  const validated = validateCalculationRequest(request);
  if (validated.kind === 'failure') {
    throw new Error('validation failed');
  }

  const solved = solve(validated.value);
  if (solved.kind === 'failure') {
    throw new Error('solve failed');
  }

  const strategy = buildStrategy(solved.value.rounds);
  const statistics = buildStatistics(strategy);

  return { strategy, statistics };
}

const intent: CalculationRequest = {
  rewardMultiplier: 20,
  roundCount: 50,
  minimumBet: 10_000,
  betStep: 1_000,
  targetProfit: { mode: 'fixedAmount', amount: 100_000 },
};

const bankrollLimit = 1_000_000;
const profitGranularity = 5_000;

const { statistics } = runPipeline(intent);

console.log('Required bankroll');
console.log('');
console.log(formatAmount(statistics.requiredBankrollAmount));
console.log('');
console.log('↓');
console.log('');

const optimization = optimize({
  intent,
  bankrollLimit,
  allowRoundReduction: true,
  profitGranularity,
});

console.log('Suggested plan');
console.log('');

if (optimization.kind === 'success') {
  const { request, explanation } = optimization;
  const profit =
    request.targetProfit.mode === 'fixedAmount' ? request.targetProfit.amount : 0;

  console.log(`Profit target: ${formatAmount(profit)}`);
  console.log(`Rounds: ${request.roundCount}`);
  console.log(`Reason: ${explanation.reason}`);

  if (explanation.reason !== OptimizationReasons.IDENTITY) {
    if (explanation.profitReducedBy > 0) {
      console.log(`Profit reduced by: ${formatAmount(explanation.profitReducedBy)}`);
    }
    if (explanation.roundsReducedBy > 0) {
      console.log(`Rounds reduced by: ${explanation.roundsReducedBy}`);
    }
  }

  const { statistics: suggestedStats, strategy } = runPipeline(request);
  console.log(`Required bankroll: ${formatAmount(suggestedStats.requiredBankrollAmount)}`);

  console.log('');
  console.log('↓');
  console.log('');

  const winRound = Math.min(3, request.roundCount);
  const simulation = simulateWinAtRound(strategy, winRound);

  console.log('Simulation');
  console.log('');
  if (simulation.kind === 'success') {
    console.log(`Win at round: ${simulation.value.winningRoundIndex}`);
    console.log(`Scenario profit: ${formatAmount(simulation.value.profitAmount)}`);
    console.log(`Bankroll at win: ${formatAmount(simulation.value.requiredBankrollAmount)}`);
  } else {
    console.log(`Simulation error: ${simulation.error.code}`);
  }
} else {
  console.log(`No feasible plan (${optimization.code})`);
  console.log(`Reason: ${optimization.explanation.reason}`);
}
