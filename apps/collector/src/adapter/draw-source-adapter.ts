import type { RawHttpResponse } from '../types/draw-result.js';

/** Raw fetch from a source — not parsed yet. */
export interface RawDrawFetch {
  readonly rawPayload: unknown;
  readonly rawResponse: RawHttpResponse | null;
}

/**
 * Source adapter for the collector poll loop.
 * `fetchLatest()` also serves resume catch-up when the source returns a full draw list.
 */
export interface DrawSourceAdapter {
  readonly id: string;
  fetchLatest(): Promise<RawDrawFetch | null>;
}
