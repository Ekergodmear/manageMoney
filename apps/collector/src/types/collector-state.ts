import type { DrawResult } from './draw-result.js';

export type CollectorStatus = 'running' | 'degraded' | 'stopped';

export interface CollectorState {
  readonly lastDrawKey: string | null;
  readonly lastDraw: DrawResult | null;
  readonly lastSuccessAt: string | null;
  readonly lastPollAt: string | null;
  readonly failureCount: number;
  readonly averageLatencyMs: number;
  readonly status: CollectorStatus;
}

export function initialCollectorState(): CollectorState {
  return {
    lastDrawKey: null,
    lastDraw: null,
    lastSuccessAt: null,
    lastPollAt: null,
    failureCount: 0,
    averageLatencyMs: 0,
    status: 'running',
  };
}
