/**
 * Level 2 — Property-based tests (fast-check).
 * @see docs/design/constraint-solver-formal-verification.md
 */

import fc from 'fast-check';
import { describe, it } from 'vitest';

import { solve } from '@/core/solver';
import { validateCalculationRequest } from '@/core/validation';

import { calculationRequestArb } from '../../support/solver-arbitraries';
import { getPropertyRuns } from '../../support/property-runs';
import {
  assertStrategyInvariants,
  isValidRequest,
  requiredBankrollAmount,
  solveValidated,
  withBetStep,
  withMinimumBet,
  withTargetProfit,
} from '../../support/solver-test-helpers';

const PROPERTY_RUNS = getPropertyRuns();

describe('ConstraintSolver — property tests (Level 2)', () => {
  it('P1 — determinism: solve(x) === solve(x)', () => {
    fc.assert(
      fc.property(calculationRequestArb, (request) => {
        const validated = validateCalculationRequest(request);
        if (validated.kind !== 'success') {
          return true;
        }
        const first = solve(validated.value);
        const second = solve(validated.value);
        if (first.kind !== 'success' || second.kind !== 'success') {
          return false;
        }
        return JSON.stringify(first.value) === JSON.stringify(second.value);
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('P2 — round count preservation', () => {
    fc.assert(
      fc.property(calculationRequestArb, (request) => {
        const strategy = solveValidated(request);
        return strategy.rounds.length === request.roundCount;
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('P3 — monotonic accumulatedSpent', () => {
    fc.assert(
      fc.property(calculationRequestArb, (request) => {
        const strategy = solveValidated(request);
        for (let i = 1; i < strategy.rounds.length; i++) {
          const prev = strategy.rounds[i - 1];
          const curr = strategy.rounds[i];
          if (prev === undefined || curr === undefined) {
            return false;
          }
          if (curr.accumulatedSpent < prev.accumulatedSpent) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('P4 — PrimaryConstraint every round (I1)', () => {
    fc.assert(
      fc.property(calculationRequestArb, (request) => {
        try {
          assertStrategyInvariants(request, solveValidated(request));
          return true;
        } catch {
          return false;
        }
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('P5 — decision domain: bet ∈ D', () => {
    fc.assert(
      fc.property(calculationRequestArb, (request) => {
        const strategy = solveValidated(request);
        for (const round of strategy.rounds) {
          if (round.betAmount < request.minimumBet) {
            return false;
          }
          if (round.betAmount % request.betStep !== 0) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('P6 — higher fixed target → requiredBankroll does not decrease', () => {
    fc.assert(
      fc.property(
        calculationRequestArb.filter((r) => r.targetProfit.mode === 'fixedAmount'),
        (request) => {
          if (request.targetProfit.mode !== 'fixedAmount') {
            return true;
          }
          const higher = withTargetProfit(request, {
            mode: 'fixedAmount',
            amount: request.targetProfit.amount + request.betStep,
          });
          if (!isValidRequest(higher)) {
            return true;
          }
          const lowerBankroll = requiredBankrollAmount(solveValidated(request));
          const higherBankroll = requiredBankrollAmount(solveValidated(higher));
          return higherBankroll >= lowerBankroll;
        },
      ),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('P7 — higher minimumBet → every bet does not decrease', () => {
    fc.assert(
      fc.property(calculationRequestArb, (request) => {
        const raised = withMinimumBet(request, request.minimumBet + request.betStep);
        if (!isValidRequest(raised)) {
          return true;
        }
        const baseStrategy = solveValidated(request);
        const raisedStrategy = solveValidated(raised);
        for (let i = 0; i < baseStrategy.rounds.length; i++) {
          const baseBet = baseStrategy.rounds[i]?.betAmount;
          const raisedBet = raisedStrategy.rounds[i]?.betAmount;
          if (baseBet === undefined || raisedBet === undefined) {
            return false;
          }
          if (raisedBet < baseBet) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });

  it('P8 — larger betStep → bets remain in new domain D', () => {
    fc.assert(
      fc.property(calculationRequestArb, (request) => {
        const newStep = request.betStep * 2;
        const alignedMin = Math.ceil(request.minimumBet / newStep) * newStep;
        const changed = withBetStep({ ...request, minimumBet: alignedMin }, newStep);
        if (!isValidRequest(changed)) {
          return true;
        }
        const strategy = solveValidated(changed);
        for (const round of strategy.rounds) {
          if (round.betAmount % newStep !== 0) {
            return false;
          }
          if (round.betAmount < alignedMin) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });
});

describe('ConstraintSolver — SolverError review', () => {
  it('validated requests always produce success (no failure branch)', () => {
    fc.assert(
      fc.property(calculationRequestArb, (request) => {
        const validated = validateCalculationRequest(request);
        if (validated.kind !== 'success') {
          return true;
        }
        const result = solve(validated.value);
        return result.kind === 'success';
      }),
      { numRuns: PROPERTY_RUNS },
    );
  });
});
