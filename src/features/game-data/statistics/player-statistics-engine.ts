import type { MarketDefinition } from '@/features/game-data/markets/market-definition';
import type { Session } from '@/features/session/session-domain';
import { getCurrentPlan } from '@/features/session/session-domain';
import {
  actualHitRate,
  hitRateDelta,
  marketExpectedHitRate,
} from '@/features/game-data/statistics/probability';

export interface SessionMarketPerformance {
  readonly marketId: string;
  readonly roundsPlayed: number;
  readonly wins: number;
  readonly expectedHitRate: number;
  readonly actualHitRate: number;
  readonly hitRateDelta: number;
  readonly totalProfit: number;
  readonly roi: number;
}

export interface PlayerMarketAggregate {
  readonly marketId: string;
  readonly label: string;
  readonly sessionsPlayed: number;
  readonly roundsPlayed: number;
  readonly wins: number;
  readonly expectedHitRate: number;
  readonly actualHitRate: number;
  readonly hitRateDelta: number;
  readonly totalProfit: number;
  readonly totalBet: number;
  readonly roi: number;
}

/**
 * Player Statistics — đọc PlayedRound trên Session.
 * Tách biệt hoàn toàn với Game Statistics (DrawStore).
 */
export function computeSessionMarketPerformance(
  session: Session,
  market: MarketDefinition,
): SessionMarketPerformance | null {
  const rounds = session.playedRounds;
  if (rounds.length === 0) {
    return null;
  }

  const wins = rounds.filter((r) => r.won).length;
  const totalBet = rounds.reduce((sum, r) => sum + r.bet, 0);
  const totalProfit = rounds.reduce((sum, r) => sum + r.profit, 0);
  const expected = marketExpectedHitRate(market);
  const actual = actualHitRate(wins, rounds.length);

  return {
    marketId: market.id,
    roundsPlayed: rounds.length,
    wins,
    expectedHitRate: expected,
    actualHitRate: actual,
    hitRateDelta: hitRateDelta(actual, expected),
    totalProfit,
    roi: totalBet > 0 ? totalProfit / totalBet : 0,
  };
}

export function computePlayerMarketAggregates(
  sessions: readonly Session[],
  markets: readonly MarketDefinition[],
): readonly PlayerMarketAggregate[] {
  const byMarket = new Map<
    string,
    {
      sessionsPlayed: number;
      roundsPlayed: number;
      wins: number;
      totalProfit: number;
      totalBet: number;
    }
  >();

  for (const session of sessions) {
    const plan = getCurrentPlan(session);
    if (plan === null || session.playedRounds.length === 0) {
      continue;
    }
    const market = markets.find((m) => m.id === plan.marketId);
    if (market === undefined) {
      continue;
    }

    const bucket = byMarket.get(market.id) ?? {
      sessionsPlayed: 0,
      roundsPlayed: 0,
      wins: 0,
      totalProfit: 0,
      totalBet: 0,
    };

    const wins = session.playedRounds.filter((r) => r.won).length;
    byMarket.set(market.id, {
      sessionsPlayed: bucket.sessionsPlayed + 1,
      roundsPlayed: bucket.roundsPlayed + session.playedRounds.length,
      wins: bucket.wins + wins,
      totalProfit: bucket.totalProfit + session.playedRounds.reduce((s, r) => s + r.profit, 0),
      totalBet: bucket.totalBet + session.playedRounds.reduce((s, r) => s + r.bet, 0),
    });
  }

  return [...byMarket.entries()].map(([marketId, agg]) => {
    const market = markets.find((m) => m.id === marketId);
    const expected = market?.probability ?? 0;
    const actual = actualHitRate(agg.wins, agg.roundsPlayed);
    return {
      marketId,
      label: market?.label ?? marketId,
      sessionsPlayed: agg.sessionsPlayed,
      roundsPlayed: agg.roundsPlayed,
      wins: agg.wins,
      expectedHitRate: expected,
      actualHitRate: actual,
      hitRateDelta: hitRateDelta(actual, expected),
      totalProfit: agg.totalProfit,
      totalBet: agg.totalBet,
      roi: agg.totalBet > 0 ? agg.totalProfit / agg.totalBet : 0,
    };
  });
}
