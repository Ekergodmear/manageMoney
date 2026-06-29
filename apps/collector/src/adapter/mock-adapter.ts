import { randomInt } from 'node:crypto';

import type { DrawSourceAdapter } from './draw-source-adapter.js';

/** Dev / soak test — generates synthetic draws. Not for production stats. */
export class MockDrawSourceAdapter implements DrawSourceAdapter {
  readonly id = 'mock';

  private seq = 100_000;

  async fetchLatest(): Promise<{ rawPayload: unknown } | null> {
    this.seq += 1;
    const d1 = randomInt(1, 7);
    const d2 = randomInt(1, 7);
    const d3 = randomInt(1, 7);
    const now = new Date().toISOString();
    return {
      rawPayload: {
        kind: 'mock',
        drawNumber: String(this.seq),
        drawTime: now,
        publishedAt: now,
        dice: [d1, d2, d3],
      },
    };
  }
}
