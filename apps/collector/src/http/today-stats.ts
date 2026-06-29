export const STATS_TIMEZONE = 'Asia/Ho_Chi_Minh';

export interface StatBucket {
  readonly value: number | string;
  readonly count: number;
}

export interface TodayStatsPayload {
  readonly generatedAt: string;
  readonly date: string;
  readonly timezone: string;
  readonly drawCount: number;
  readonly totals: readonly StatBucket[];
  readonly flowers: readonly StatBucket[];
}

const TOTAL_VALUES = Array.from({ length: 16 }, (_, i) => i + 3);
const FLOWER_VALUES = [1, 2, 3, 4, 5, 6].map((d) => `${d}${d}${d}`);

/** Date prefix YYYY-MM-DD in fixed offset (Bingo18 = +07:00). */
export function todayDatePrefix(offsetHours = 7): string {
  const shifted = new Date(Date.now() + offsetHours * 3_600_000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildTodayStats(
  rows: readonly { total: number; flower: string | null }[],
  date: string,
  generatedAt = new Date().toISOString(),
): TodayStatsPayload {
  const totalCounts = new Map<number, number>();
  for (const t of TOTAL_VALUES) totalCounts.set(t, 0);
  const flowerCounts = new Map<string, number>();
  for (const f of FLOWER_VALUES) flowerCounts.set(f, 0);

  for (const row of rows) {
    if (totalCounts.has(row.total)) {
      totalCounts.set(row.total, (totalCounts.get(row.total) ?? 0) + 1);
    }
    if (row.flower !== null && flowerCounts.has(row.flower)) {
      flowerCounts.set(row.flower, (flowerCounts.get(row.flower) ?? 0) + 1);
    }
  }

  return {
    generatedAt,
    date,
    timezone: STATS_TIMEZONE,
    drawCount: rows.length,
    totals: TOTAL_VALUES.map((value) => ({ value, count: totalCounts.get(value) ?? 0 })),
    flowers: FLOWER_VALUES.map((value) => ({ value, count: flowerCounts.get(value) ?? 0 })),
  };
}
