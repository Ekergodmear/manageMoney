import {
  buildStatistics,
  buildStrategy,
  solve,
  validateCalculationRequest,
} from '@stake/constraint-engine';

import type { CalculationRequest, Strategy, StrategyStatistics } from '@stake/constraint-engine';

import { parseMoneyPositiveInt } from '@/lib/money-format';

const MULTIPLIER_DECIMAL_PLACES = 2;

export interface PlannerFormValues {
  presetId: string;
  marketId: string;
  targetProfit: string;
  roundCount: string;
  rewardMultiplier: string;
  minimumBet: string;
  maximumBet: string;
  betStep: string;
  userBankroll: string;
  winTaxEnabled: boolean;
  winTaxThreshold: string;
  winTaxRatePercent: string;
}

export type PlannerField =
  | 'targetProfit'
  | 'roundCount'
  | 'rewardMultiplier'
  | 'minimumBet'
  | 'betStep'
  | 'userBankroll'
  | 'winTaxThreshold'
  | 'winTaxRatePercent'
  | 'request';

export interface GenerateResult {
  strategy: Strategy;
  statistics: StrategyStatistics;
  request: CalculationRequest;
  userBankroll: number | null;
}

function normalizeNumericInput(raw: string): string {
  return raw.trim().replace(/,/g, '').replace(/\s/g, '');
}

function parsePositiveInt(raw: string): number | null {
  const normalized = normalizeNumericInput(raw);
  if (normalized === '') {
    return null;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return null;
  }
  return value;
}

function parseDecimal(raw: string, maxDecimalPlaces: number): number | null {
  const normalized = normalizeNumericInput(raw);
  if (normalized === '') {
    return null;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return null;
  }
  const scale = 10 ** maxDecimalPlaces;
  const scaled = Math.round(value * scale);
  if (Math.abs(value * scale - scaled) > 1e-6) {
    return null;
  }
  return value;
}

const VALIDATION_MESSAGE_VI: Record<string, string> = {
  'roundCount must be at least 1': 'Số vòng phải từ 1 trở lên.',
  'roundCount must be an integer': 'Số vòng phải là số nguyên.',
  'roundCount must be a finite number': 'Số vòng phải là số hợp lệ.',
  'rewardMultiplier must be greater than 1': 'Hệ số thưởng phải lớn hơn 1.',
  'rewardMultiplier must be a finite number': 'Hệ số thưởng phải là số hợp lệ.',
  'rewardMultiplier must have at most 2 decimal places':
    'Hệ số thưởng hỗ trợ tối đa 2 chữ số thập phân.',
  'minimumBet must be a multiple of betStep': 'Cược tối thiểu phải chia hết cho bước cược.',
  'minimumBet must be at least 1': 'Cược tối thiểu phải từ 1 trở lên.',
  'betStep must be at least 1': 'Bước cược phải từ 1 trở lên.',
  'targetProfit.amount must be non-negative': 'Lợi nhuận mục tiêu không được âm.',
  'targetProfit.amount must be an integer': 'Lợi nhuận mục tiêu phải là số nguyên.',
  'winTax.threshold must be at least 1': 'Ngưỡng thuế phải từ 1 trở lên.',
  'winTax.ratePercent must be between 1 and 99': 'Thuế phải từ 1% đến 99%.',
  'winTax.threshold must be a finite integer': 'Ngưỡng thuế phải là số nguyên.',
  'winTax.ratePercent must be a finite integer': 'Thuế phải là số nguyên.',
};

function mapValidationPath(path: string): PlannerField {
  if (path === 'targetProfit' || path === 'targetProfit.amount') {
    return 'targetProfit';
  }
  if (
    path === 'rewardMultiplier' ||
    path === 'roundCount' ||
    path === 'minimumBet' ||
    path === 'betStep' ||
    path === 'winTax.threshold'
  ) {
    return path === 'winTax.threshold' ? 'winTaxThreshold' : path;
  }
  if (path === 'winTax.ratePercent') {
    return 'winTaxRatePercent';
  }
  return 'request';
}

export function buildRequest(
  values: PlannerFormValues,
): { request: CalculationRequest } | { fieldErrors: Partial<Record<PlannerField, string>> } {
  const fieldErrors: Partial<Record<PlannerField, string>> = {};

  const targetProfit = parseMoneyPositiveInt(values.targetProfit);
  if (targetProfit === null) {
    fieldErrors.targetProfit = 'Vui lòng nhập số nguyên.';
  }

  const roundCount = parsePositiveInt(values.roundCount);
  if (roundCount === null) {
    fieldErrors.roundCount = 'Vui lòng nhập số nguyên.';
  }

  const rewardMultiplier = parseDecimal(values.rewardMultiplier, MULTIPLIER_DECIMAL_PLACES);
  if (rewardMultiplier === null) {
    fieldErrors.rewardMultiplier = 'Vui lòng nhập số hợp lệ (tối đa 2 chữ số thập phân).';
  }

  const minimumBet = parseMoneyPositiveInt(values.minimumBet);
  if (minimumBet === null) {
    fieldErrors.minimumBet = 'Vui lòng nhập số nguyên.';
  }

  const betStep = parseMoneyPositiveInt(values.betStep);
  if (betStep === null) {
    fieldErrors.betStep = 'Vui lòng nhập số nguyên.';
  }

  let winTaxThreshold: number | null = null;
  let winTaxRatePercent: number | null = null;
  if (values.winTaxEnabled) {
    winTaxThreshold = parseMoneyPositiveInt(values.winTaxThreshold);
    if (winTaxThreshold === null) {
      fieldErrors.winTaxThreshold = 'Vui lòng nhập số nguyên.';
    }
    winTaxRatePercent = parsePositiveInt(values.winTaxRatePercent);
    if (winTaxRatePercent === null) {
      fieldErrors.winTaxRatePercent = 'Vui lòng nhập số nguyên.';
    } else if (winTaxRatePercent < 1 || winTaxRatePercent > 99) {
      fieldErrors.winTaxRatePercent = 'Thuế phải từ 1% đến 99%.';
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  if (
    targetProfit === null ||
    roundCount === null ||
    rewardMultiplier === null ||
    minimumBet === null ||
    betStep === null
  ) {
    return { fieldErrors: { request: 'Vui lòng kiểm tra lại các ô bắt buộc.' } };
  }

  return {
    request: {
      rewardMultiplier,
      roundCount,
      minimumBet,
      betStep,
      targetProfit: { mode: 'fixedAmount', amount: targetProfit },
      ...(values.winTaxEnabled && winTaxThreshold !== null && winTaxRatePercent !== null
        ? { winTax: { threshold: winTaxThreshold, ratePercent: winTaxRatePercent } }
        : {}),
    },
  };
}

export function continuePlan(
  formValues: PlannerFormValues,
  targetRoundCount: number,
): {
  result?: GenerateResult;
  fieldErrors?: Partial<Record<PlannerField, string>>;
} {
  const currentRounds = Number(formValues.roundCount);
  if (!Number.isFinite(currentRounds) || targetRoundCount <= currentRounds) {
    return {
      fieldErrors: {
        roundCount: `Số vòng mới phải lớn hơn ${String(currentRounds)}.`,
      },
    };
  }
  return generatePlan({ ...formValues, roundCount: String(targetRoundCount) });
}

export function generatePlan(values: PlannerFormValues): {
  result?: GenerateResult;
  fieldErrors?: Partial<Record<PlannerField, string>>;
} {
  const built = buildRequest(values);
  if ('fieldErrors' in built) {
    return { fieldErrors: built.fieldErrors };
  }

  const validated = validateCalculationRequest(built.request);
  if (validated.kind === 'failure') {
    const fieldErrors: Partial<Record<PlannerField, string>> = {};
    for (const err of validated.error.errors) {
      const field = mapValidationPath(err.path);
      if (fieldErrors[field] === undefined) {
        fieldErrors[field] = VALIDATION_MESSAGE_VI[err.message] ?? 'Giá trị không hợp lệ.';
      }
    }
    return { fieldErrors };
  }

  const solved = solve(validated.value);
  if (solved.kind === 'failure') {
    return {
      fieldErrors: { request: 'Không tạo được kế hoạch. Vui lòng kiểm tra lại thông tin.' },
    };
  }

  const strategy = buildStrategy(solved.value.rounds);
  const statistics = buildStatistics(strategy);
  const bankrollRaw = values.userBankroll.trim();
  const userBankroll = bankrollRaw === '' ? null : parseMoneyPositiveInt(bankrollRaw);

  return {
    result: {
      strategy,
      statistics,
      request: built.request,
      userBankroll,
    },
  };
}

export const DEFAULT_PLANNER_FORM: PlannerFormValues = {
  presetId: 'bingo-120',
  marketId: 'total-4',
  targetProfit: '100.000',
  roundCount: '500',
  rewardMultiplier: '120',
  minimumBet: '10.000',
  maximumBet: '1.000.000',
  betStep: '10.000',
  userBankroll: '30.000.000',
  winTaxEnabled: true,
  winTaxThreshold: '10.000.000',
  winTaxRatePercent: '10',
};
