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

export type ImproveMode =
  | 'keep-profit'
  | 'keep-rounds'
  | 'reduce-both'
  | 'fit-bankroll'
  | 'fit-max-bet';

export interface ImproveExplanation {
  readonly profitReducedBy: number;
  readonly roundsReducedBy: number;
}

export interface ImproveOption {
  readonly id: ImproveMode;
  readonly mode: ImproveMode;
  readonly label: string;
  readonly description: string;
  readonly result: GenerateResult;
  readonly explanation: ImproveExplanation;
}

export interface ImproveContext {
  readonly formValues: PlannerFormValues;
  readonly generated: GenerateResult;
  readonly maxBetLimit?: number;
}

const MODE_LABELS: Record<ImproveMode, string> = {
  'keep-profit': 'Giữ lợi nhuận — giảm vòng',
  'keep-rounds': 'Giữ số vòng — giảm lợi nhuận',
  'reduce-both': 'Giảm cả hai',
  'fit-bankroll': 'Vừa vốn có',
  'fit-max-bet': 'Giới hạn cược tối đa',
};

function profitGranularityFromForm(formValues: PlannerFormValues): number {
  const profit = parseMoneyPositiveInt(formValues.targetProfit) ?? 100_000;
  const step = parseMoneyPositiveInt(formValues.betStep) ?? 10_000;
  return Math.max(step, Math.floor(profit / 20));
}

function userBankrollFromForm(formValues: PlannerFormValues): number | null {
  const raw = formValues.userBankroll.trim();
  if (raw === '') {
    return null;
  }
  return parseMoneyPositiveInt(raw);
}

function generateFromRequest(
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

function formValuesFromRequest(
  formValues: PlannerFormValues,
  request: CalculationRequest,
): PlannerFormValues {
  const profit =
    request.targetProfit.mode === 'fixedAmount'
      ? String(request.targetProfit.amount)
      : formValues.targetProfit;
  return {
    ...formValues,
    roundCount: String(request.roundCount),
    targetProfit: profit,
  };
}

function buildOption(
  mode: ImproveMode,
  result: GenerateResult,
  originalRounds: number,
  originalProfit: number,
  description: string,
): ImproveOption {
  const newProfit =
    result.request.targetProfit.mode === 'fixedAmount'
      ? result.request.targetProfit.amount
      : originalProfit;
  return {
    id: mode,
    mode,
    label: MODE_LABELS[mode],
    description,
    result,
    explanation: {
      profitReducedBy: Math.max(0, originalProfit - newProfit),
      roundsReducedBy: Math.max(0, originalRounds - result.request.roundCount),
    },
  };
}

function improveKeepProfit(
  formValues: PlannerFormValues,
  intent: CalculationRequest,
  bankrollLimit: number,
): ImproveOption | null {
  const originalRounds = intent.roundCount;
  const originalProfit =
    intent.targetProfit.mode === 'fixedAmount' ? intent.targetProfit.amount : 0;
  const userBankroll = userBankrollFromForm(formValues);

  for (let rounds = originalRounds - 1; rounds >= 1; rounds--) {
    const candidate: CalculationRequest = { ...intent, roundCount: rounds };
    const result = generateFromRequest(candidate, userBankroll);
    if (result !== null && result.statistics.requiredBankrollAmount <= bankrollLimit) {
      return buildOption(
        'keep-profit',
        result,
        originalRounds,
        originalProfit,
        `${String(rounds)} vòng · lợi nhuận ${originalProfit.toLocaleString('vi-VN')} đ`,
      );
    }
  }
  return null;
}

function improveFromOptimize(
  mode: ImproveMode,
  formValues: PlannerFormValues,
  intent: CalculationRequest,
  bankrollLimit: number,
  allowRoundReduction: boolean,
): ImproveOption | null {
  const originalRounds = intent.roundCount;
  const originalProfit =
    intent.targetProfit.mode === 'fixedAmount' ? intent.targetProfit.amount : 0;
  const userBankroll = userBankrollFromForm(formValues);

  const outcome = optimize({
    intent,
    bankrollLimit,
    allowRoundReduction,
    profitGranularity: profitGranularityFromForm(formValues),
  });

  if (outcome.kind === 'failure') {
    return null;
  }

  const result = generateFromRequest(outcome.request, userBankroll);
  if (result === null) {
    return null;
  }

  const profit =
    outcome.request.targetProfit.mode === 'fixedAmount'
      ? outcome.request.targetProfit.amount
      : originalProfit;
  const desc = `${String(outcome.request.roundCount)} vòng · lợi nhuận ${profit.toLocaleString('vi-VN')} đ · cần ${result.statistics.requiredBankrollAmount.toLocaleString('vi-VN')} đ`;

  return buildOption(mode, result, originalRounds, originalProfit, desc);
}

function improveMaxBet(
  formValues: PlannerFormValues,
  intent: CalculationRequest,
  maxBetLimit: number,
  bankrollLimit: number | null,
): ImproveOption | null {
  const originalRounds = intent.roundCount;
  const originalProfit =
    intent.targetProfit.mode === 'fixedAmount' ? intent.targetProfit.amount : 0;
  const userBankroll = userBankrollFromForm(formValues);
  const limit = bankrollLimit ?? Number.MAX_SAFE_INTEGER;

  for (let rounds = originalRounds; rounds >= 1; rounds--) {
    const roundIntent: CalculationRequest = { ...intent, roundCount: rounds };
    const outcome = optimize({
      intent: roundIntent,
      bankrollLimit: limit,
      allowRoundReduction: false,
      profitGranularity: profitGranularityFromForm(formValues),
    });
    if (outcome.kind === 'failure') {
      continue;
    }
    const result = generateFromRequest(outcome.request, userBankroll);
    if (
      result !== null &&
      result.statistics.maximumBetAmount <= maxBetLimit &&
      result.statistics.requiredBankrollAmount <= limit
    ) {
      return buildOption(
        'fit-max-bet',
        result,
        originalRounds,
        originalProfit,
        `Cược max ${result.statistics.maximumBetAmount.toLocaleString('vi-VN')} đ ≤ ${maxBetLimit.toLocaleString('vi-VN')} đ`,
      );
    }
  }
  return null;
}

export function runImproveForMode(
  context: ImproveContext,
  mode: ImproveMode,
): ImproveOption | null {
  const built = buildRequest(context.formValues);
  if ('fieldErrors' in built) {
    return null;
  }
  const intent = built.request;
  const bankroll = userBankrollFromForm(context.formValues);
  if (bankroll === null && mode !== 'fit-max-bet') {
    return null;
  }
  const bankrollLimit = bankroll ?? 0;

  switch (mode) {
    case 'keep-profit':
      return improveKeepProfit(context.formValues, intent, bankrollLimit);
    case 'keep-rounds':
      return improveFromOptimize('keep-rounds', context.formValues, intent, bankrollLimit, false);
    case 'reduce-both':
      return improveFromOptimize('reduce-both', context.formValues, intent, bankrollLimit, true);
    case 'fit-bankroll':
      return improveFromOptimize('fit-bankroll', context.formValues, intent, bankrollLimit, true);
    case 'fit-max-bet':
      if (context.maxBetLimit === undefined) {
        return null;
      }
      return improveMaxBet(context.formValues, intent, context.maxBetLimit, bankroll);
    default:
      return null;
  }
}

export function runAllImproveOptions(context: ImproveContext): ImproveOption[] {
  const modes: ImproveMode[] = ['fit-bankroll', 'keep-profit', 'keep-rounds', 'reduce-both'];
  if (context.maxBetLimit !== undefined) {
    modes.push('fit-max-bet');
  }

  const seen = new Set<string>();
  const options: ImproveOption[] = [];

  for (const mode of modes) {
    const option = runImproveForMode(context, mode);
    if (option === null) {
      continue;
    }
    const key = `${String(option.result.request.roundCount)}-${String(
      option.result.request.targetProfit.mode === 'fixedAmount'
        ? option.result.request.targetProfit.amount
        : 0,
    )}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    options.push(option);
  }

  return options.sort(
    (a, b) =>
      a.result.statistics.requiredBankrollAmount - b.result.statistics.requiredBankrollAmount,
  );
}

export function applyImproveOption(
  formValues: PlannerFormValues,
  option: ImproveOption,
): PlannerFormValues {
  return formValuesFromRequest(formValues, option.result.request);
}

export function bankrollShortfall(generated: GenerateResult): number | null {
  const bankroll = generated.userBankroll;
  if (bankroll === null) {
    return null;
  }
  const gap = generated.statistics.requiredBankrollAmount - bankroll;
  return gap > 0 ? gap : null;
}
