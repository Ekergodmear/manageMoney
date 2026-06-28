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

export function generateStrategyCandidate(intent: StrategySearchIntent): StrategyCandidate | null {
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

  const required = result.statistics.requiredBankrollAmount;
  if (required > intent.bankrollLimit) {
    return null;
  }

  return candidateFromResult(request, formValues, result, intent.targetProfit);
}

export function searchStrategyCandidates(
  baseForm: PlannerFormValues,
  bankrollLimit: number,
  roundCounts: readonly number[],
  targetProfits: readonly number[],
): StrategyCandidate[] {
  const seen = new Set<string>();
  const candidates: StrategyCandidate[] = [];

  for (const roundCount of roundCounts) {
    for (const targetProfit of targetProfits) {
      const candidate = generateStrategyCandidate({
        baseForm,
        roundCount,
        targetProfit,
        bankrollLimit,
      });
      if (candidate === null) {
        continue;
      }
      const key = `${String(candidate.rounds)}-${String(candidate.profit)}-${String(candidate.requiredBankroll)}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      candidates.push(candidate);
    }
  }

  return candidates;
}
