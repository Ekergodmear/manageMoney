import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';

/** Kết quả một vòng đã settle — append-only trên Session. */
export interface PlayedRound {
  readonly id: string;
  readonly round: number;
  readonly drawKey: string;
  readonly drawAt: string;
  readonly dice: readonly [number, number, number];
  readonly market: string;
  readonly bet: number;
  readonly won: boolean;
  readonly prize: number;
  readonly tax: number;
  readonly netPrize: number;
  readonly profit: number;
  readonly bankrollAfter: number;
  readonly settledAt: string;
}

export interface PlayedRoundDrawSnapshot {
  readonly drawKey: string;
  readonly drawAt: string;
  readonly dice: readonly [number, number, number];
  readonly total: number;
  readonly flower: string | null;
  readonly smallLarge: 'small' | 'tie' | 'large';
}

export function drawToSnapshot(draw: CollectorDrawResult): PlayedRoundDrawSnapshot {
  return {
    drawKey: draw.drawKey,
    drawAt: draw.drawAt,
    dice: draw.dice,
    total: draw.total,
    flower: draw.flower,
    smallLarge: draw.smallLarge,
  };
}
