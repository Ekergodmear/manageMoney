import type { DiagnosisCause } from './diagnosis-cause.js';

export type OperationalHealthStatus = 'healthy' | 'degraded' | 'offline';

export interface CollectorHealthSummary {
  readonly status: OperationalHealthStatus;
  readonly adapter: string;
  readonly lastSuccess: string | null;
  readonly lastPoll: string | null;
  readonly latestDraw: string | null;
  readonly resumeState: string;
  readonly retryCount: number;
  readonly catchUpCount: number;
  readonly duplicatesSkipped: number;
}

export interface LastFailureView {
  readonly cause: DiagnosisCause;
  readonly at: string;
  readonly retryAttempt: number;
  readonly retryMax: number;
  readonly durationMs: number | null;
}

export interface FreshnessView {
  readonly lastDrawAgeMs: number | null;
  readonly lastDrawAgeLabel: string;
  readonly stale: boolean;
  readonly warning: string | null;
}

export interface CollectorHealthDetails {
  readonly drawCount: number;
  readonly failureCount: number;
  readonly resumedFromDrawKey: string | null;
  readonly averageLatencyMs: number;
  readonly runtimeStatus: string;
}

/** DTO for Product Shell Diagnostics — no React. */
export interface CollectorHealthSnapshot {
  readonly status: OperationalHealthStatus;
  readonly diagnosis: DiagnosisCause | null;
  readonly summary: CollectorHealthSummary;
  readonly details: CollectorHealthDetails;
  readonly lastFailure: LastFailureView | null;
  readonly freshness: FreshnessView;
}
