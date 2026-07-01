import { describe, expect, it } from 'vitest';

import {
  assessHealth,
  buildCollectorHealth,
  formatHealthReport,
} from '../src/health/collector-health.js';
import { resetRetryObservabilityForTests } from '../src/retry/retry-state.js';
import { initialCollectorState } from '../src/types/collector-state.js';

describe('collector health', () => {
  it('reports healthy when recent success', () => {
    resetRetryObservabilityForTests();
    const latestDraw = {
      drawKey: '20260629215300',
      gameId: 'bingo18',
      marketVersion: 1,
      drawAt: '2026-06-29T21:53:00+07:00',
      publishedAt: '2026-06-29T21:53:00+07:00',
      publishedEstimated: true,
      collectedAt: new Date().toISOString(),
      latencyMs: 0,
      dice: [1, 2, 3] as const,
      total: 6,
      flower: null,
      smallLarge: 'small' as const,
      source: 'bingo18',
      rawPayload: {},
      rawResponse: null,
    };
    const state = {
      ...initialCollectorState(),
      lastDrawKey: latestDraw.drawKey,
      lastSuccessAt: new Date().toISOString(),
      lastPollAt: new Date().toISOString(),
      lastDraw: latestDraw,
    };
    const health = buildCollectorHealth(state, 'bingo18', 5, latestDraw);
    const report = assessHealth(health);
    expect(report.overall).toBe('healthy');
    const text = formatHealthReport(report);
    expect(text).toContain('Collector');
    expect(text).toContain('Status            Healthy');
    expect(text).toContain('Latest Draw       20260629215300');
  });
});
