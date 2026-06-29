import type { RawHttpResponse } from '../types/draw-result.js';

/** Raw fetch from a source — not parsed yet. */
export interface RawDrawFetch {
  readonly rawPayload: unknown;
  readonly rawResponse: RawHttpResponse | null;
}

export interface DrawSourceAdapter {
  readonly id: string;
  fetchLatest(): Promise<RawDrawFetch | null>;
}
