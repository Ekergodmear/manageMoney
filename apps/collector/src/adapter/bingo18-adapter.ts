import { collectorError, collectorLog } from '../log/collector-log.js';
import type { RawHttpResponse } from '../types/draw-result.js';
import { withRetry } from '../util/retry.js';
import type { DrawSourceAdapter, RawDrawFetch } from './draw-source-adapter.js';

const DEFAULT_API_URL = 'https://bingo18.top/data/data.json';
const DEFAULT_TIMEOUT_MS = 15_000;

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

interface FetchResult {
  readonly data: Bingo18ApiResponse;
  readonly rawResponse: RawHttpResponse;
}

function parseApiJson(text: string): Bingo18ApiResponse {
  return JSON.parse(text) as Bingo18ApiResponse;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

async function fetchJson(url: string, timeoutMs: number): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'StakeCollector/0.2',
      },
    });

    const body = await response.text();
    const rawResponse: RawHttpResponse = {
      status: response.status,
      headers: headersToRecord(response.headers),
      body,
    };

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return { data: parseApiJson(body), rawResponse };
  } finally {
    clearTimeout(timer);
  }
}

function sortDrawsNewestFirst(draws: readonly Bingo18RawDraw[]): Bingo18RawDraw[] {
  return [...draws].sort(
    (a, b) => new Date(b.drawAt).getTime() - new Date(a.drawAt).getTime(),
  );
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
      Number(process.env['COLLECTOR_BINGO18_TIMEOUT_MS'] ?? DEFAULT_TIMEOUT_MS);
  }

  async fetchLatest(): Promise<RawDrawFetch | null> {
    try {
      const { data, rawResponse } = await withRetry(
        () => fetchJson(this.apiUrl, this.timeoutMs),
        { maxAttempts: 3, baseDelayMs: 1_000, label: 'bingo18-fetch' },
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
      collectorError('Bingo18 fetch failed', err);
      return null;
    }
  }
}
