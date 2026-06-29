import { describe, expect, it } from 'vitest';

import { AdaptivePollStrategy } from '../src/strategy/adaptive-poll-strategy.js';
import { initialCollectorState } from '../src/types/collector-state.js';

describe('AdaptivePollStrategy', () => {
  it('uses 60s when no prior draw', () => {
    const strategy = new AdaptivePollStrategy();
    expect(strategy.nextDelayMs(initialCollectorState())).toBe(60_000);
  });

  it('uses 10s when last draw was over 6 minutes ago', () => {
    const strategy = new AdaptivePollStrategy();
    const old = new Date(Date.now() - 7 * 60_000).toISOString();
    const state = {
      ...initialCollectorState(),
      lastDrawKey: 'old-key',
      lastDraw: {
        drawKey: 'old-key',
        gameId: 'bingo18',
        marketVersion: 1,
        drawAt: old,
        publishedAt: old,
        publishedEstimated: true,
        collectedAt: old,
        latencyMs: 0,
        dice: [1, 2, 3] as const,
        total: 6,
        flower: null,
        smallLarge: 'small' as const,
        source: 'mock',
        rawPayload: {},
        rawResponse: null,
      },
    };
    expect(strategy.nextDelayMs(state)).toBe(10_000);
  });
});
