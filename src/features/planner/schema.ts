import { z } from 'zod';

import { parseMoneyPositiveInt } from '@/lib/money-format';

function moneyField(label: string) {
  return z
    .string()
    .min(1, `Vui lòng nhập ${label}.`)
    .refine((v) => parseMoneyPositiveInt(v) !== null, 'Vui lòng nhập số nguyên.');
}

export const plannerFormSchema = z
  .object({
    marketId: z.string().min(1, 'Vui lòng chọn market.'),
    targetProfit: moneyField('lợi nhuận mục tiêu'),
    roundCount: z
      .string()
      .min(1, 'Vui lòng nhập số vòng.')
      .refine((v) => /^\d+$/.test(v.trim()), 'Số vòng phải là số nguyên.'),
    rewardMultiplier: z.string().min(1, 'Vui lòng nhập hệ số thưởng.'),
    minimumBet: moneyField('cược tối thiểu'),
    maximumBet: z.string(),
    betStep: moneyField('bước cược'),
    userBankroll: z.string(),
    winTaxEnabled: z.boolean(),
    winTaxThreshold: z.string(),
    winTaxRatePercent: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.userBankroll.trim() !== '' && parseMoneyPositiveInt(data.userBankroll) === null) {
      ctx.addIssue({ code: 'custom', message: 'Vốn phải là số nguyên.', path: ['userBankroll'] });
    }
    if (data.winTaxEnabled) {
      if (parseMoneyPositiveInt(data.winTaxThreshold) === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Ngưỡng thuế phải là số nguyên.',
          path: ['winTaxThreshold'],
        });
      }
      const rate = Number(data.winTaxRatePercent.trim());
      if (!Number.isInteger(rate) || rate < 1 || rate > 99) {
        ctx.addIssue({
          code: 'custom',
          message: 'Thuế phải từ 1% đến 99%.',
          path: ['winTaxRatePercent'],
        });
      }
    }
  });

export type PlannerFormSchema = z.infer<typeof plannerFormSchema>;

export function isMoneyField(name: string): boolean {
  return [
    'targetProfit',
    'minimumBet',
    'maximumBet',
    'betStep',
    'winTaxThreshold',
    'userBankroll',
  ].includes(name);
}

export function formatMoneyFieldValue(name: string, raw: string): string {
  if (!isMoneyField(name)) {
    return raw;
  }
  const digits = raw.replace(/\D/g, '');
  if (digits === '') {
    return '';
  }
  const value = Number(digits);
  if (!Number.isFinite(value)) {
    return raw;
  }
  return value.toLocaleString('vi-VN');
}

export function displayMoney(value: string): string {
  if (value.trim() === '') {
    return '—';
  }
  const parsed = parseMoneyPositiveInt(value);
  return parsed === null ? value : `${parsed.toLocaleString('vi-VN')} đ`;
}

export function estimateBankrollHint(values: {
  targetProfit: string;
  roundCount: string;
  minimumBet: string;
}): string | null {
  const minBet = parseMoneyPositiveInt(values.minimumBet);
  const rounds = Number(values.roundCount.trim());
  if (minBet === null || !Number.isFinite(rounds) || rounds < 1) {
    return null;
  }
  const rough = minBet * rounds;
  return `≥ ${rough.toLocaleString('vi-VN')} đ (ước tính thô)`;
}
