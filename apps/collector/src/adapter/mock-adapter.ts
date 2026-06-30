import { randomInt } from 'node:crypto';

import type { RawHttpResponse } from '../types/draw-result.js';
import type { DrawSourceAdapter, RawDrawFetch } from './draw-source-adapter.js';

/** Dev / soak test — generates synthetic draws. Not for production stats. */
export class MockDrawSourceAdapter implements DrawSourceAdapter {
  readonly id = 'mock';

  private seq = 100_000;

  fetchLatest(): Promise<RawDrawFetch> {
    this.seq += 1;
    const d1 = randomInt(1, 7);
    const d2 = randomInt(1, 7);
    const d3 = randomInt(1, 7);
    const now = new Date().toISOString();
    const rawPayload = {
      kind: 'mock' as const,
      drawKey: String(this.seq),
      drawAt: now,
      publishedAt: now,
      dice: [d1, d2, d3] as [number, number, number],
    };
    const rawResponse: RawHttpResponse = {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(rawPayload),
    };
    return Promise.resolve({ rawPayload, rawResponse });
  }
}
