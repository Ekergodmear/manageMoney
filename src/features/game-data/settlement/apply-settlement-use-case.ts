import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';
import type { PlayedRound } from '@/features/game-data/entities/played-round';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { findMarketForPlan } from '@/features/game-data/markets/market-catalog';
import {
  getCurrentPlan,
  isPlanExhausted,
  startCurrentPlan,
  type Session,
  type SessionTimelineEvent,
} from '@/features/session/session-domain';
import { accumulatedAtRound } from '@/features/planner/plan-display';
import { winTaxFromRewardPolicy } from '@/features/game-data/settlement/settlement-form-utils';
import { settleRound } from '@/features/game-data/settlement/round-settlement-engine';
import type { SettlementResult } from '@/features/game-data/settlement/settlement-result';

export interface ApplySettlementOutcome {
  readonly session: Session;
  readonly settlement: SettlementResult;
  readonly playedRound: PlayedRound;
  readonly won: boolean;
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildPlayedRound(settlement: SettlementResult): PlayedRound {
  const { draw } = settlement;
  return {
    id: crypto.randomUUID(),
    round: settlement.roundIndex,
    drawKey: draw.drawKey,
    drawAt: draw.drawAt,
    dice: draw.dice,
    market: settlement.marketId,
    bet: settlement.bet,
    won: settlement.marketMatched,
    prize: settlement.prize,
    tax: settlement.tax,
    netPrize: settlement.netPrize,
    profit: settlement.profit,
    bankrollAfter: settlement.bankrollAfter,
    settledAt: settlement.settlementTime,
  };
}

function addTimelineEvent(
  session: Session,
  event: Omit<SessionTimelineEvent, 'at'>,
): SessionTimelineEvent[] {
  return [...session.timeline, { ...event, at: nowIso() }];
}

/**
 * Settle một kỳ quay mới lên session đang playing.
 */
export function applySettlementToSession(
  session: Session,
  draw: CollectorDrawResult,
  preset: GamePolicyPreset | undefined,
): ApplySettlementOutcome | null {
  if (session.status !== 'playing') {
    return null;
  }
  if (draw.drawKey === session.lastSettledDrawKey) {
    return null;
  }

  let workingSession = session;
  let plan = getCurrentPlan(workingSession);
  if (plan !== null && plan.status === 'ready') {
    workingSession = startCurrentPlan(workingSession);
    plan = getCurrentPlan(workingSession);
  }
  if (plan === null || plan.status !== 'playing') {
    return null;
  }
  if (isPlanExhausted(plan)) {
    return null;
  }

  const market = findMarketForPlan(preset, plan.marketId);
  if (market === undefined) {
    return null;
  }

  const roundIndex = plan.completedThroughRound + 1;
  const round = plan.generated.strategy.rounds[roundIndex - 1];
  if (round === undefined) {
    return null;
  }

  const accumulatedSpentBefore = accumulatedAtRound(
    plan.generated.strategy.rounds,
    plan.completedThroughRound,
  );
  const winTax = winTaxFromRewardPolicy(market.rewardPolicy);
  const settlement = settleRound({
    draw,
    roundIndex,
    bet: round.betAmount,
    accumulatedSpentBefore,
    market,
    ...(winTax !== undefined ? { winTax } : {}),
  });

  const playedRound = buildPlayedRound(settlement);
  const label = settlement.marketMatched
    ? `Trúng ${market.label} · +${String(settlement.netPrize)}`
    : `Thua vòng ${String(roundIndex)} · Tổng ${String(draw.total)}`;

  if (settlement.marketMatched) {
    const finishedPlan = {
      ...plan,
      completedThroughRound: roundIndex,
      status: 'won' as const,
      finishedAt: nowIso(),
    };
    const updatedSession: Session = {
      ...workingSession,
      status: 'won',
      profitAmount: settlement.profit,
      finishedAt: nowIso(),
      lastSettledDrawKey: draw.drawKey,
      playedRounds: [...workingSession.playedRounds, playedRound],
      plans: workingSession.plans.map((p) => (p.id === plan.id ? finishedPlan : p)),
      timeline: addTimelineEvent(workingSession, {
        type: 'round-settled',
        planId: plan.id,
        roundIndex,
        betAmount: round.betAmount,
        label,
      }),
      updatedAt: nowIso(),
    };
    return { session: updatedSession, settlement, playedRound, won: true };
  }

  const advancedPlan = {
    ...plan,
    completedThroughRound: roundIndex,
  };
  const updatedSession: Session = {
    ...workingSession,
    lastSettledDrawKey: draw.drawKey,
    playedRounds: [...workingSession.playedRounds, playedRound],
    plans: workingSession.plans.map((p) => (p.id === plan.id ? advancedPlan : p)),
    timeline: addTimelineEvent(workingSession, {
      type: 'round-settled',
      planId: plan.id,
      roundIndex,
      betAmount: round.betAmount,
      label,
    }),
    updatedAt: nowIso(),
  };
  return { session: updatedSession, settlement, playedRound, won: false };
}
