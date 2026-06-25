import { describe, expect, it } from 'vitest';

import type { CalculationRequest } from '@/application/dto';
import { validateCalculationRequest } from '@/core/validation';
import { solve } from '@/core/solver';

import fixedGolden from '../../fixtures/solver/fixed-profit-x20-5-rounds.golden.json';
import breakEvenGolden from '../../fixtures/solver/break-even-x20-5-rounds.golden.json';
import percentageGolden from '../../fixtures/solver/percentage-x20-3-rounds.golden.json';

interface GoldenFixture {
  readonly name: string;
  readonly request: CalculationRequest;
  readonly strategy: { readonly rounds: readonly unknown[] };
}

const GOLDEN_FIXTURES: readonly GoldenFixture[] = [
  fixedGolden as GoldenFixture,
  breakEvenGolden as GoldenFixture,
  percentageGolden as GoldenFixture,
];

function solveValidated(request: CalculationRequest) {
  const validated = validateCalculationRequest(request);
  expect(validated.kind).toBe('success');
  if (validated.kind !== 'success') {
    return null;
  }
  return solve(validated.value);
}

describe('ConstraintSolver — golden master', () => {
  it.each(GOLDEN_FIXTURES)('$name — byte-stable JSON match', (fixture) => {
    const result = solveValidated(fixture.request);
    expect(result?.kind).toBe('success');
    if (result?.kind !== 'success') {
      return;
    }

    const actual = JSON.stringify(result.value);
    const expected = JSON.stringify(fixture.strategy);
    expect(actual).toBe(expected);
  });
});

describe('ConstraintSolver — determinism', () => {
  it('identical input produces identical Strategy JSON', () => {
    const request = fixedGolden.request as CalculationRequest;
    const first = solveValidated(request);
    const second = solveValidated(request);

    expect(first?.kind).toBe('success');
    expect(second?.kind).toBe('success');
    if (first?.kind !== 'success' || second?.kind !== 'success') {
      return;
    }

    expect(JSON.stringify(first.value)).toBe(JSON.stringify(second.value));
  });
});
