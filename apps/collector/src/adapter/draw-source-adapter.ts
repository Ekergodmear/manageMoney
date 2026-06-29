import type { ParseResult } from '../types/parse-result.js';

/** Raw fetch from a source — not parsed yet. */
export interface RawDrawFetch {
  readonly rawPayload: unknown;
}

export interface DrawSourceAdapter {
  readonly id: string;
  fetchLatest(): Promise<RawDrawFetch | null>;
}
