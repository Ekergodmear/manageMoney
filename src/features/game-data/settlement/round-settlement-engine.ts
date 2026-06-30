import type { WinTax } from '@/application/dto';
import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';
import { drawToSnapshot } from '@/features/game-data/entities/played-round';
import type { MarketDefinition } from '@/features/game-data/markets/market-definition';
import { marketMatchesDraw } from '@/features/game-data/markets/market-resolver';
import { grossRewardFromBet, netRewardFromBet } from '@/core/monetary/net-reward';
import { encodeRewardMultiplier } from '@/core/monetary/reward-multiplier-encoding';

import type { SettlementResult } from './settlement-result';

export interface SettlementInput {
  readonly draw: CollectorDrawResult;
  readonly roundIndex: number;
  readonly bet: number;
  readonly accumulatedSpentBefore: number;
  readonly market: MarketDefinition;
  readonly winTax?: WinTax;
  readonly settlementTime?: string;
}

export function settleRound(input: SettlementInput): SettlementResult {
  const { draw, roundIndex, bet, accumulatedSpentBefore, market, winTax } = input;
  const settlementTime = input.settlementTime ?? new Date().toISOString();
  const snapshot = drawToSnapshot(draw);
  const marketMatched = marketMatchesDraw(market, snapshot);
  const bankrollAfter = accumulatedSpentBefore + bet;

  if (!marketMatched) {
    return {
      draw,
      roundIndex,
      bet,
      marketId: market.id,
      marketMatched: false,
      prize: 0,
      tax: 0,
      netPrize: 0,
      profit: -bet,
      bankrollAfter,
      settlementTime,
    };
  }

  const encoded = encodeRewardMultiplier(market.multiplier);
  const gross = grossRewardFromBet(bet, encoded);
  const netPrize = netRewardFromBet(bet, encoded, winTax);
  const tax = gross - netPrize;
  const profit = netPrize - bankrollAfter;

  return {
    draw,
    roundIndex,
    bet,
    marketId: market.id,
    marketMatched: true,
    prize: gross,
    tax,
    netPrize,
    profit,
    bankrollAfter,
    settlementTime,
  };
}
