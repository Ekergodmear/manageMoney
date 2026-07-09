import { collectorError, collectorLog } from '../log/collector-log.js';
import { executeWithRetry, DEFAULT_RETRY_POLICY } from '../retry/retry-policy.js';
import type { RawHttpResponse } from '../types/draw-result.js';
import { drawKeyFromDrawAt } from '../types/draw-result.js';
import { fetchJsonWithTimeout } from './fetch-json.js';
import type { DrawSourceAdapter, RawDrawFetch } from './draw-source-adapter.js';
import {
  fetchKqxsoBingo18DrawsSinceCutover,
  isBeforeKqxsoCutover,
  KQXSO_BINGO18_CUTOVER_DATE,
} from './kqxso-bingo18-client.js';

const DEFAULT_LEGACY_API_URL = 'https://bingo18.top/data/data.json';

export interface Bingo18RawDraw {
  readonly drawAt: string;
  readonly winningResult: string;
}

export interface Bingo18ListPayload {
  readonly kind: 'bingo18-list';
  readonly draws: readonly Bingo18RawDraw[];
  readonly fetchedAt: string;
  readonly sources?: readonly string[];
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

export function mergeBingo18DrawSources(
  legacy: readonly Bingo18RawDraw[],
  modern: readonly Bingo18RawDraw[],
  cutover = process.env['COLLECTOR_KQXSO_SINCE'] ?? KQXSO_BINGO18_CUTOVER_DATE,
): Bingo18RawDraw[] {
  const byKey = new Map<string, Bingo18RawDraw>();

  for (const draw of legacy) {
    if (isBeforeKqxsoCutover(draw.drawAt, cutover)) {
      byKey.set(drawKeyFromDrawAt(draw.drawAt), draw);
    }
  }

  for (const draw of modern) {
    byKey.set(drawKeyFromDrawAt(draw.drawAt), draw);
  }

  return [...byKey.values()].sort(
    (a, b) => new Date(a.drawAt).getTime() - new Date(b.drawAt).getTime(),
  );
}

async function fetchLegacyBingo18Draws(
  apiUrl: string,
  timeoutMs: number,
): Promise<{ draws: readonly Bingo18RawDraw[]; rawResponse: RawHttpResponse } | null> {
  const { data, rawResponse } = await executeWithRetry(
    () => fetchJsonWithTimeout(apiUrl, parseApiJson, timeoutMs),
    {
      maxAttempts: DEFAULT_RETRY_POLICY.maxAttempts,
      baseDelayMs: DEFAULT_RETRY_POLICY.baseDelayMs,
      label: 'bingo18-legacy-fetch',
    },
  );

  const draws = data.gbingoDraws;
  if (draws === undefined || draws.length === 0) {
    return null;
  }

  return { draws, rawResponse };
}

/**
 * Lịch sử trước 01/07/2026: bingo18.top · từ 01/07: kqxso.top (ketquasoxo backend).
 * Returns merged bingo18-list for catch-up / sync.
 */
export class Bingo18DrawSourceAdapter implements DrawSourceAdapter {
  readonly id = 'bingo18';

  private readonly legacyApiUrl: string;
  private readonly timeoutMs: number;
  private readonly kqxsoSince: string;
  private readonly kqxsoEnabled: boolean;

  constructor(options?: {
    apiUrl?: string;
    timeoutMs?: number;
    kqxsoSince?: string;
    kqxsoEnabled?: boolean;
  }) {
    this.legacyApiUrl =
      options?.apiUrl ?? process.env['COLLECTOR_BINGO18_API_URL'] ?? DEFAULT_LEGACY_API_URL;
    this.timeoutMs =
      options?.timeoutMs ??
      Number(process.env['COLLECTOR_BINGO18_TIMEOUT_MS'] ?? DEFAULT_RETRY_POLICY.requestTimeoutMs);
    this.kqxsoSince =
      options?.kqxsoSince ?? process.env['COLLECTOR_KQXSO_SINCE'] ?? KQXSO_BINGO18_CUTOVER_DATE;
    this.kqxsoEnabled =
      options?.kqxsoEnabled ?? process.env['COLLECTOR_KQXSO_ENABLED'] !== '0';
  }

  async fetchLatest(): Promise<RawDrawFetch | null> {
    const sources: string[] = [];
    let legacyDraws: readonly Bingo18RawDraw[] = [];
    let rawResponse: RawHttpResponse | null = null;

    if (this.kqxsoEnabled) {
      try {
        const legacy = await fetchLegacyBingo18Draws(this.legacyApiUrl, this.timeoutMs);
        if (legacy !== null) {
          legacyDraws = legacy.draws;
          rawResponse = legacy.rawResponse;
          sources.push('bingo18.top');
        }
      } catch (err) {
        collectorError('Bingo18 legacy fetch failed — continuing with kqxso only', err);
      }

      const modernDraws = await fetchKqxsoBingo18DrawsSinceCutover(this.kqxsoSince);
      if (modernDraws.length > 0) {
        sources.push('kqxso.top');
      }

      const merged = mergeBingo18DrawSources(legacyDraws, modernDraws, this.kqxsoSince);
      if (merged.length === 0) {
        collectorLog('No bingo18 draws from legacy or kqxso');
        return null;
      }

      collectorLog(
        `Merged bingo18 source: ${String(legacyDraws.length)} legacy + ${String(modernDraws.length)} kqxso → ${String(merged.length)} kỳ`,
      );

      return {
        rawPayload: {
          kind: 'bingo18-list',
          draws: sortDrawsNewestFirst(merged),
          fetchedAt: new Date().toISOString(),
          sources,
        },
        rawResponse,
      };
    }

    try {
      const legacy = await fetchLegacyBingo18Draws(this.legacyApiUrl, this.timeoutMs);
      if (legacy === null) {
        collectorLog('Bingo18 API returned no draws');
        return null;
      }

      return {
        rawPayload: {
          kind: 'bingo18-list',
          draws: sortDrawsNewestFirst(legacy.draws),
          fetchedAt: new Date().toISOString(),
          sources: ['bingo18.top'],
        },
        rawResponse: legacy.rawResponse,
      };
    } catch (err) {
      collectorError('Bingo18 fetch failed after retries — scheduler handoff', err);
      return null;
    }
  }
}

export type { RawHttpResponse };
