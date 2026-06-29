import type { BankrollAmount, BetAmount } from '@/core/models';
import { accumulatedAtRound } from '@/features/planner/plan-display';
import type { Plan, Session } from '@/features/session/session-domain';

export type SessionId = string;
export type PlanId = string;

export interface ContinuationContext {
  readonly sessionId: SessionId;
  readonly currentPlanId: PlanId;
  readonly completedRounds: number;
  readonly accumulatedSpent: BankrollAmount;
  readonly lastBetAmount: BetAmount;
  readonly targetTotalRounds: number;
}

export function buildContinuationContext(
  session: Session,
  parentPlan: Plan,
  targetTotalRounds: number,
): ContinuationContext {
  const rounds = parentPlan.generated.strategy.rounds;
  const completed = parentPlan.completedThroughRound;
  const lastRound = rounds[Math.max(0, completed - 1)];
  const lastBetAmount = lastRound?.betAmount ?? rounds[0]?.betAmount ?? 0;

  return {
    sessionId: session.id,
    currentPlanId: parentPlan.id,
    completedRounds: completed,
    accumulatedSpent: accumulatedAtRound(rounds, completed),
    lastBetAmount,
    targetTotalRounds,
  };
}
