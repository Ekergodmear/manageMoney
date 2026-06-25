import { describe, expect, it } from 'vitest';

import type { CalculationRequest } from '@/application/dto';

describe('CalculationRequest DTO', () => {
  it('accepts break-even shape (data only, no validation)', () => {
    const request: CalculationRequest = {
      rewardMultiplier: 20,
      roundCount: 5,
      minimumBet: 10_000,
      betStep: 1_000,
      targetProfit: { mode: 'breakEven' },
    };

    expect(request.targetProfit.mode).toBe('breakEven');
    expect(request.roundCount).toBe(5);
  });

  it('accepts fixedAmount targetProfit discriminant', () => {
    const request: CalculationRequest = {
      rewardMultiplier: 20,
      roundCount: 5,
      minimumBet: 10_000,
      betStep: 1_000,
      targetProfit: { mode: 'fixedAmount', amount: 100_000 },
    };

    if (request.targetProfit.mode === 'fixedAmount') {
      expect(request.targetProfit.amount).toBe(100_000);
    }
  });
});
