import {
  buildStatistics,
  buildStrategy,
  optimize,
  solve,
  validateCalculationRequest,
  type CalculationRequest,
} from '@stake/constraint-engine';

import {
  buildRequest,
  type GenerateResult,
  type PlannerFormValues,
} from '@/features/planner/plan-service';
import { parseMoneyPositiveInt } from '@/lib/money-format';

export interface StrategyCandidate {
  readonly result: GenerateResult;
  readonly formValues: PlannerFormValues;
  readonly profit: number;
  readonly rounds: number;
  readonly requiredBankroll: number;
  readonly maxBet: number;
}

export interface StrategySearchIntent {
  readonly baseForm: PlannerFormValues;
  readonly roundCount: number;
  readonly targetProfit: number;
  readonly bankrollLimit: number;
}

function formatMoneyInt(n: number): string {
  return n.toLocaleString('vi-VN');
}

function profitGranularity(form: PlannerFormValues): number {
  return parseMoneyPositiveInt(form.betStep) ?? 10_000;
}

export function generatePlanFromRequest(
  request: CalculationRequest,
  userBankroll: number | null,
): GenerateResult | null {
  const validated = validateCalculationRequest(request);
  if (validated.kind === 'failure') {
    return null;
  }
  const solved = solve(validated.value);
  if (solved.kind === 'failure') {
    return null;
  }
  const strategy = buildStrategy(solved.value.rounds);
  const statistics = buildStatistics(strategy);
  return { strategy, statistics, request, userBankroll };
}

export function fitRequestToBankroll(
  intent: CalculationRequest,
  bankrollLimit: number,
  form: PlannerFormValues,
  options?: { allowRoundReduction?: boolean },
): CalculationRequest | null {
  const optimized = optimize({
    intent,
    bankrollLimit,
    allowRoundReduction: options?.allowRoundReduction ?? true,
    profitGranularity: profitGranularity(form),
  });
  return optimized.kind === 'success' ? optimized.request : null;
}

function formFromIntent(
  baseForm: PlannerFormValues,
  roundCount: number,
  targetProfit: number,
  bankrollLimit: number,
): PlannerFormValues {
  return {
    ...baseForm,
    roundCount: String(roundCount),
    targetProfit: formatMoneyInt(targetProfit),
    userBankroll: formatMoneyInt(bankrollLimit),
  };
}

function candidateFromResult(
  request: CalculationRequest,
  formValues: PlannerFormValues,
  result: GenerateResult,
  fallbackProfit: number,
): StrategyCandidate {
  const profit =
    request.targetProfit.mode === 'fixedAmount' ? request.targetProfit.amount : fallbackProfit;

  return {
    result,
    formValues: {
      ...formValues,
      roundCount: String(request.roundCount),
      targetProfit: formatMoneyInt(profit),
    },
    profit,
    rounds: request.roundCount,
    requiredBankroll: result.statistics.requiredBankrollAmount,
    maxBet: result.statistics.maximumBetAmount,
  };
}

function solveStrategyCandidate(intent: StrategySearchIntent): StrategyCandidate | null {
  const formValues = formFromIntent(
    intent.baseForm,
    intent.roundCount,
    intent.targetProfit,
    intent.bankrollLimit,
  );

  const built = buildRequest(formValues);
  if ('fieldErrors' in built) {
    return null;
  }

  const result = generatePlanFromRequest(built.request, intent.bankrollLimit);
  if (result === null) {
    return null;
  }

  if (result.statistics.requiredBankrollAmount > intent.bankrollLimit) {
    return null;
  }

  return candidateFromResult(built.request, formValues, result, intent.targetProfit);
}

function fitStrategyCandidate(intent: StrategySearchIntent): StrategyCandidate | null {
  const formValues = formFromIntent(
    intent.baseForm,
    intent.roundCount,
    intent.targetProfit,
    intent.bankrollLimit,
  );

  const built = buildRequest(formValues);
  if ('fieldErrors' in built) {
    return null;
  }

  let request = built.request;
  let result = generatePlanFromRequest(request, intent.bankrollLimit);

  if (result === null || result.statistics.requiredBankrollAmount > intent.bankrollLimit) {
    const fitted = fitRequestToBankroll(request, intent.bankrollLimit, intent.baseForm);
    if (fitted === null) {
      return null;
    }
    request = fitted;
    const fittedForm = formFromIntent(
      intent.baseForm,
      request.roundCount,
      request.targetProfit.mode === 'fixedAmount'
        ? request.targetProfit.amount
        : intent.targetProfit,
      intent.bankrollLimit,
    );
    result = generatePlanFromRequest(request, intent.bankrollLimit);
    if (result === null) {
      return null;
    }
    return candidateFromResult(request, fittedForm, result, intent.targetProfit);
  }

  return candidateFromResult(request, formValues, result, intent.targetProfit);
}

/** Solve + optional optimize fit — dùng khi cần một candidate cụ thể. */
export function generateStrategyCandidate(intent: StrategySearchIntent): StrategyCandidate | null {
  return solveStrategyCandidate(intent) ?? fitStrategyCandidate(intent);
}

function dedupeCandidates(candidates: StrategyCandidate[]): StrategyCandidate[] {
  const seen = new Set<string>();
  const unique: StrategyCandidate[] = [];
  for (const candidate of candidates) {
    const key = `${String(candidate.rounds)}-${String(candidate.profit)}-${String(candidate.requiredBankroll)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(candidate);
  }
  return unique;
}

function fallbackFitIntents(
  baseForm: PlannerFormValues,
  bankrollLimit: number,
  roundCounts: readonly number[],
  targetProfits: readonly number[],
): StrategySearchIntent[] {
  const midRound = roundCounts[Math.floor(roundCounts.length / 2)] ?? roundCounts[0];
  const midProfit = targetProfits[Math.floor(targetProfits.length / 2)] ?? targetProfits[0];
  if (midRound === undefined || midProfit === undefined) {
    return [];
  }
  const seeds: StrategySearchIntent[] = [
    { baseForm, roundCount: midRound, targetProfit: midProfit, bankrollLimit },
  ];
  const firstRound = roundCounts[0];
  const lastRound = roundCounts[roundCounts.length - 1];
  const firstProfit = targetProfits[0];
  if (firstRound !== undefined && firstProfit !== undefined) {
    seeds.push({ baseForm, roundCount: firstRound, targetProfit: firstProfit, bankrollLimit });
  }
  if (lastRound !== undefined && lastRound !== midRound) {
    seeds.push({ baseForm, roundCount: lastRound, targetProfit: midProfit, bankrollLimit });
  }
  return seeds;
}

export function searchStrategyCandidates(
  baseForm: PlannerFormValues,
  bankrollLimit: number,
  roundCounts: readonly number[],
  targetProfits: readonly number[],
): StrategyCandidate[] {
  const candidates: StrategyCandidate[] = [];

  for (const roundCount of roundCounts) {
    for (const targetProfit of targetProfits) {
      const candidate = solveStrategyCandidate({
        baseForm,
        roundCount,
        targetProfit,
        bankrollLimit,
      });
      if (candidate !== null) {
        candidates.push(candidate);
      }
    }
  }

  const solved = dedupeCandidates(candidates);
  if (solved.length > 0) {
    return solved;
  }

  const fitted: StrategyCandidate[] = [];
  for (const intent of fallbackFitIntents(baseForm, bankrollLimit, roundCounts, targetProfits)) {
    const candidate = fitStrategyCandidate(intent);
    if (candidate !== null) {
      fitted.push(candidate);
    }
  }
  return dedupeCandidates(fitted);
}
