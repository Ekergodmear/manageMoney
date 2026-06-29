import { collectorError, collectorLog } from '../log/collector-log.js';
import { withRetry } from '../util/retry.js';
import type { DrawSourceAdapter } from './draw-source-adapter.js';

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

function parseApiJson(text: string): Bingo18ApiResponse {
  return JSON.parse(text) as Bingo18ApiResponse;
}

async function fetchJson(url: string, timeoutMs: number): Promise<Bingo18ApiResponse> {
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    return parseApiJson(text);
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

  async fetchLatest(): Promise<{ rawPayload: Bingo18ListPayload } | null> {
    try {
      const data = await withRetry(() => fetchJson(this.apiUrl, this.timeoutMs), {
        maxAttempts: 3,
        baseDelayMs: 1_000,
        label: 'bingo18-fetch',
      });

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
      };
    } catch (err) {
      collectorError('Bingo18 fetch failed', err);
      return null;
    }
  }
}
