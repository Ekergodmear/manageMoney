import type { DashboardResponse, GameMonitorSnapshot } from './collector-api-types';

const DEFAULT_BASE = 'http://localhost:8788';

function baseUrl(): string {
  return import.meta.env.VITE_COLLECTOR_API_URL ?? DEFAULT_BASE;
}

export async function fetchGameMonitorSnapshot(): Promise<GameMonitorSnapshot> {
  try {
    const response = await fetch(`${baseUrl()}/dashboard`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Collector API /dashboard: HTTP ${response.status}`);
    }
    const data = (await response.json()) as DashboardResponse;
    return {
      generatedAt: data.generatedAt,
      collector: data.collector,
      health: data.health,
      latest: data.latestDraw,
      today: data.todayStats,
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
