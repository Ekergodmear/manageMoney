import { collectorError, collectorLog } from '../log/collector-log.js';
import { executeWithRetry, DEFAULT_RETRY_POLICY } from '../retry/retry-policy.js';
import type { RawHttpResponse } from '../types/draw-result.js';
import { fetchJsonWithTimeout } from './fetch-json.js';
import type { DrawSourceAdapter, RawDrawFetch } from './draw-source-adapter.js';

const DEFAULT_API_URL = 'https://bingo18.top/data/data.json';

export interface Bingo18RawDraw {
  readonly drawAt: string;
  readonly winningResult: string;
}

export interface Bingo18ListPayload {
  readonly kind: 'bingo18-list';
  readonly draws: readonly Bingo18RawDraw[];
  readonly fetchedAt: string;
}

interface Bingo18ApiResponse {
  readonly gbingoDraws?: readonly Bingo18RawDraw[];
}

function parseApiJson(text: string): Bingo18ApiResponse {
  return JSON.parse(text) as Bingo18ApiResponse;
}

function sortDrawsNewestFirst(draws: readonly Bingo18RawDraw[]): Bingo18RawDraw[] {
  return [...draws].sort((a, b) => new Date(b.drawAt).getTime() - new Date(a.drawAt).getTime());
}

/**
 * Fetches bingo18.top data.json (hidden API used by the stats site).
 * Returns full draw list for catch-up after restart — does not throw.
 */
export class Bingo18DrawSourceAdapter implements DrawSourceAdapter {
  readonly id = 'bingo18';

  private readonly apiUrl: string;
  private readonly timeoutMs: number;

  constructor(options?: { apiUrl?: string; timeoutMs?: number }) {
    this.apiUrl = options?.apiUrl ?? process.env['COLLECTOR_BINGO18_API_URL'] ?? DEFAULT_API_URL;
    this.timeoutMs =
      options?.timeoutMs ??
      Number(process.env['COLLECTOR_BINGO18_TIMEOUT_MS'] ?? DEFAULT_RETRY_POLICY.requestTimeoutMs);
  }

  async fetchLatest(): Promise<RawDrawFetch | null> {
    try {
      const { data, rawResponse } = await executeWithRetry(
        () => fetchJsonWithTimeout(this.apiUrl, parseApiJson, this.timeoutMs),
        {
          maxAttempts: DEFAULT_RETRY_POLICY.maxAttempts,
          baseDelayMs: DEFAULT_RETRY_POLICY.baseDelayMs,
          label: 'bingo18-fetch',
        },
      );

      const draws = data.gbingoDraws;
      if (draws === undefined || draws.length === 0) {
        collectorLog('Bingo18 API returned no draws');
        return null;
      }

      const sorted = sortDrawsNewestFirst(draws);
      return {
        rawPayload: {
          kind: 'bingo18-list',
          draws: sorted,
          fetchedAt: new Date().toISOString(),
        },
        rawResponse,
      };
    } catch (err) {
      collectorError('Bingo18 fetch failed after retries — scheduler handoff', err);
      return null;
    }
  }
}

export type { RawHttpResponse };
