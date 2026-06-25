import { describe, expect, it } from 'vitest';

import type { CalculationRequest } from '@/application/dto';
import { solve } from '@/core/solver';
import { validateCalculationRequest } from '@/core/validation';

import fixedGolden from '../../fixtures/solver/fixed-profit-x20-5-rounds.golden.json';
import breakEvenGolden from '../../fixtures/solver/break-even-x20-5-rounds.golden.json';
import percentageGolden from '../../fixtures/solver/percentage-x20-3-rounds.golden.json';

/**
 * Pre-migration baselines captured at arithmetic migration start.
 * M = 20 — any drift invalidates the migration.
 */
const PRE_MIGRATION_BASELINES: Readonly<Record<string, string>> = {
  'fixed-profit-x20-5':
    '{"rounds":[{"index":1,"betAmount":10000,"rewardAmount":200000,"accumulatedSpent":10000},{"index":2,"betAmount":10000,"rewardAmount":200000,"accumulatedSpent":20000},{"index":3,"betAmount":10000,"rewardAmount":200000,"accumulatedSpent":30000},{"index":4,"betAmount":10000,"rewardAmount":200000,"accumulatedSpent":40000},{"index":5,"betAmount":10000,"rewardAmount":200000,"accumulatedSpent":50000}]}',
  'break-even-x20-5':
    '{"rounds":[{"index":1,"betAmount":10000,"rewardAmount":200000,"accumulatedSpent":10000},{"index":2,"betAmount":10000,"rewardAmount":200000,"accumulatedSpent":20000},{"index":3,"betAmount":10000,"rewardAmount":200000,"accumulatedSpent":30000},{"index":4,"betAmount":10000,"rewardAmount":200000,"accumulatedSpent":40000},{"index":5,"betAmount":10000,"rewardAmount":200000,"accumulatedSpent":50000}]}',
  'percentage-x20-3':
    '{"rounds":[{"index":1,"betAmount":10000,"rewardAmount":200000,"accumulatedSpent":10000},{"index":2,"betAmount":10000,"rewardAmount":200000,"accumulatedSpent":20000},{"index":3,"betAmount":10000,"rewardAmount":200000,"accumulatedSpent":30000}]}',
};

const REGRESSION_FIXTURES: ReadonlyArray<{
  readonly name: string;
  readonly request: CalculationRequest;
}> = [
  { name: 'fixed-profit-x20-5', request: fixedGolden.request as CalculationRequest },
  { name: 'break-even-x20-5', request: breakEvenGolden.request as CalculationRequest },
  { name: 'percentage-x20-3', request: percentageGolden.request as CalculationRequest },
];

function solveValidated(request: CalculationRequest) {
  const validated = validateCalculationRequest(request);
  expect(validated.kind).toBe('success');
  if (validated.kind !== 'success') {
    return null;
  }
  return solve(validated.value);
}

describe('Arithmetic migration — regression guarantee (M = 20)', () => {
  it.each(REGRESSION_FIXTURES)('$name — byte-identical to pre-migration baseline', (fixture) => {
    const baseline = PRE_MIGRATION_BASELINES[fixture.name];
    expect(baseline).toBeDefined();

    const result = solveValidated(fixture.request);
    expect(result?.kind).toBe('success');
    if (result?.kind !== 'success') {
      return;
    }

    expect(JSON.stringify(result.value)).toBe(baseline);
  });
});
