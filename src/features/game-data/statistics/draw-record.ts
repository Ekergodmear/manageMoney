import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';
import type { PlayedRoundDrawSnapshot } from '@/features/game-data/entities/played-round';
import type { DrawRecord } from '@/features/game-data/statistics/statistics-types';

export function collectorDrawToRecord(draw: CollectorDrawResult): DrawRecord {
  return {
    drawKey: draw.drawKey,
    drawAt: draw.drawAt,
    dice: draw.dice,
    total: draw.total,
    flower: draw.flower,
    smallLarge: draw.smallLarge,
  };
}

export function drawRecordToSnapshot(draw: DrawRecord): PlayedRoundDrawSnapshot {
  return {
    drawKey: draw.drawKey,
    drawAt: draw.drawAt,
    dice: draw.dice,
    total: draw.total,
    flower: draw.flower,
    smallLarge: draw.smallLarge,
  };
}
