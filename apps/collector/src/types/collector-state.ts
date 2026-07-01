import type { DrawResult } from './draw-result.js';

export type CollectorStatus = 'running' | 'degraded' | 'stopped';

export type ResumeState = 'fresh' | 'resumed' | 'catch-up';

export interface CollectorState {
  readonly lastDrawKey: string | null;
  readonly lastDraw: DrawResult | null;
  readonly lastSuccessAt: string | null;
  readonly lastPollAt: string | null;
  readonly failureCount: number;
  readonly averageLatencyMs: number;
  readonly duplicatesSkipped: number;
  readonly resumeState: ResumeState;
  readonly catchUpCount: number;
  readonly resumedFromDrawKey: string | null;
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
    duplicatesSkipped: 0,
    resumeState: 'fresh',
    catchUpCount: 0,
    resumedFromDrawKey: null,
    status: 'running',
  };
}
