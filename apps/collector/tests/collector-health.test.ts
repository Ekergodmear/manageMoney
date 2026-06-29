import { describe, expect, it } from 'vitest';

import {
  assessHealth,
  buildCollectorHealth,
  formatHealthReport,
} from '../src/health/collector-health.js';
import { initialCollectorState } from '../src/types/collector-state.js';

describe('collector health', () => {
  it('reports healthy when recent success', () => {
    const state = {
      ...initialCollectorState(),
      lastSuccessAt: new Date().toISOString(),
      lastDraw: {
        id: '1',
        gameId: 'bingo18',
        marketVersion: 1,
        drawNumber: 'draw-1',
        drawTime: new Date().toISOString(),
        publishedAt: null,
        collectedAt: new Date().toISOString(),
        latencyMs: 0,
        dice: [1, 2, 3] as const,
        total: 6,
        flower: null,
        smallLarge: 'small' as const,
        rawPayload: {},
        source: 'bingo18',
      },
    };
    const health = buildCollectorHealth(state, 'bingo18', 5);
    const report = assessHealth(health);
    expect(report.overall).toBe('healthy');
    expect(formatHealthReport(report)).toContain('Collector Health');
  });
});
