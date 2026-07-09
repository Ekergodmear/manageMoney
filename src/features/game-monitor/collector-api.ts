import type {
  DashboardResponse,
  GameMonitorSnapshot,
  TodayStatsResponse,
} from './collector-api-types';
import { getCollectorApiBase } from './collector-endpoint';

function readCount(dist: Record<string, number>, key: string): number {
  const value = dist[key];
  return typeof value === 'number' ? value : 0;
}

/** Accept new array shape or legacy totalDistribution/flowerDistribution objects. */
function normalizeTodayStats(raw: unknown): TodayStatsResponse | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;

  if (Array.isArray(o['totals']) && Array.isArray(o['flowers'])) {
    return raw as TodayStatsResponse;
  }

  const totalDist = o['totalDistribution'];
  const flowerDist = o['flowerDistribution'];
  if (typeof totalDist !== 'object' || totalDist === null) return null;
  if (typeof flowerDist !== 'object' || flowerDist === null) return null;

  const totalRecord = totalDist as Record<string, number>;
  const flowerRecord = flowerDist as Record<string, number>;
  const totals = Array.from({ length: 16 }, (_, i) => {
    const value = i + 3;
    return { value, count: readCount(totalRecord, String(value)) };
  });
  const flowers = ['111', '222', '333', '444', '555', '666'].map((value) => ({
    value,
    count: readCount(flowerRecord, value),
  }));

  return {
    generatedAt: typeof o['generatedAt'] === 'string' ? o['generatedAt'] : new Date().toISOString(),
    date: typeof o['date'] === 'string' ? o['date'] : '',
    timezone: typeof o['timezone'] === 'string' ? o['timezone'] : 'Asia/Ho_Chi_Minh',
    drawCount: typeof o['drawCount'] === 'number' ? o['drawCount'] : 0,
    totals,
    flowers,
  };
}

export async function fetchGameMonitorSnapshot(): Promise<GameMonitorSnapshot> {
  try {
    const response = await fetch(`${getCollectorApiBase()}/dashboard`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Collector API /dashboard: HTTP ${String(response.status)}`);
    }
    const data = (await response.json()) as DashboardResponse;
    return {
      generatedAt: data.generatedAt,
      collector: data.collector,
      health: data.health,
      latest: data.latestDraw ?? null,
      today: normalizeTodayStats(data.todayStats),
      error: null,
    };
  } catch (err) {
    return {
      generatedAt: new Date().toISOString(),
      collector: null,
      health: null,
      latest: null,
      today: null,
      error: err instanceof Error ? err.message : 'Không kết nối được Collector',
    };
  }
}
