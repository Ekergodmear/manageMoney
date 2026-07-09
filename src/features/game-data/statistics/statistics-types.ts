/** Pure data shapes — no React, no Session. */

export interface DrawRecord {
  readonly drawKey: string;
  readonly drawAt: string;
  readonly dice: readonly [number, number, number];
  readonly total: number;
  readonly flower: string | null;
  readonly smallLarge: 'small' | 'tie' | 'large';
}

export interface MarketFrequencyStat {
  readonly marketId: string;
  readonly label: string;
  readonly observedCount: number;
  readonly expectedCount: number;
  readonly variance: number;
  readonly expectedHitRate: number;
  readonly actualHitRate: number;
  readonly hitRateDelta: number;
  readonly drought: number;
  readonly lastSeenAt: string | null;
  readonly lastSeenDrawsAgo: number | null;
}

export interface DistributionBucket {
  readonly key: string;
  readonly label: string;
  readonly count: number;
}

export interface RollingWindowSnapshot {
  readonly windowSize: number;
  readonly drawCount: number;
  readonly markets: readonly MarketFrequencyStat[];
}

export interface MarketRankings {
  readonly byFrequency: readonly string[];
  readonly byVariance: readonly string[];
  readonly byDrought: readonly string[];
}

export interface HotColdSnapshot {
  readonly hot: {
    readonly marketId: string;
    readonly label: string;
    readonly hitRateDelta: number;
  } | null;
  readonly cold: {
    readonly marketId: string;
    readonly label: string;
    readonly drought: number;
  } | null;
}

export interface GameStatisticsSnapshot {
  readonly generatedAt: string;
  readonly totalDraws: number;
  readonly fromDrawAt: string | null;
  readonly toDrawAt: string | null;
  readonly markets: readonly MarketFrequencyStat[];
  readonly rollingWindows: readonly RollingWindowSnapshot[];
  readonly rankings: MarketRankings;
  readonly distributions: {
    readonly totals: readonly DistributionBucket[];
    readonly flowers: readonly DistributionBucket[];
    readonly sizes: readonly DistributionBucket[];
  };
  readonly hotCold: HotColdSnapshot;
}

export interface StatisticsEngineOptions {
  readonly rollingWindowSizes?: readonly number[];
}

export const DEFAULT_ROLLING_WINDOW_SIZES: readonly number[] = [100, 500, 1000];
