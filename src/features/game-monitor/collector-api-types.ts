/** Read-only API types — mirror Collector HTTP (B1.5). */

export interface CollectorDrawResult {
  readonly drawKey: string;
  readonly gameId: string;
  readonly marketVersion: number;
  readonly drawAt: string;
  readonly publishedAt: string;
  readonly publishedEstimated: boolean;
  readonly collectedAt: string;
  readonly latencyMs: number;
  readonly dice: readonly [number, number, number];
  readonly total: number;
  readonly flower: string | null;
  readonly smallLarge: 'small' | 'tie' | 'large';
  readonly source: string;
}

export interface CollectorVersionInfo {
  readonly version: string;
  readonly commit: string | null;
}

export interface CollectorHealthResponse {
  readonly status: 'running' | 'degraded' | 'stopped';
  readonly overall: string;
  readonly lastPollAt: string | null;
  readonly lastSuccessAt: string | null;
  readonly averageLatencyMs: number;
  readonly failureCount: number;
  readonly activeAdapterId: string;
  readonly drawCount: number;
  readonly lastDrawKey: string | null;
}

export interface StatBucket {
  readonly value: number | string;
  readonly count: number;
}

export interface TodayStatsResponse {
  readonly generatedAt: string;
  readonly date: string;
  readonly timezone: string;
  readonly drawCount: number;
  readonly totals: readonly StatBucket[];
  readonly flowers: readonly StatBucket[];
}

export interface DashboardResponse {
  readonly generatedAt: string;
  readonly collector: CollectorVersionInfo;
  readonly health: CollectorHealthResponse;
  readonly latestDraw: CollectorDrawResult | null;
  readonly todayStats: TodayStatsResponse;
}

export interface GameMonitorSnapshot {
  readonly generatedAt: string;
  readonly collector: CollectorVersionInfo | null;
  readonly health: CollectorHealthResponse | null;
  readonly latest: CollectorDrawResult | null;
  readonly today: TodayStatsResponse | null;
  readonly error: string | null;
}
