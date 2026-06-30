import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';

export interface SettlementResult {
  readonly draw: CollectorDrawResult;
  readonly roundIndex: number;
  readonly bet: number;
  readonly marketId: string;
  readonly marketMatched: boolean;
  readonly prize: number;
  readonly tax: number;
  readonly netPrize: number;
  readonly profit: number;
  readonly bankrollAfter: number;
  readonly settlementTime: string;
}
