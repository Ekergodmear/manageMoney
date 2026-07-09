import { collectorError, collectorLog } from '../log/collector-log.js';
import { executeWithRetry, DEFAULT_RETRY_POLICY } from '../retry/retry-policy.js';
import type { Bingo18RawDraw } from './bingo18-adapter.js';
import { fetchJsonWithTimeout } from './fetch-json.js';

/** Ngày chuyển nguồn chính thức sang kqxso.top (giờ VN). */
export const KQXSO_BINGO18_CUTOVER_DATE = '2026-07-01';

const DEFAULT_KQXSO_DRAWS_URL = 'https://kqxso.top/api/gbingo/draws';

export interface KqxsoApiDraw {
  readonly drawAt: string;
  readonly winningResult: string;
  readonly metadata?: {
    readonly originalTime?: string;
    readonly source?: string;
    readonly createdAt?: string;
  };
}

interface KqxsoDrawsPage {
  readonly data?: {
    readonly data?: readonly KqxsoApiDraw[];
    readonly total?: number;
    readonly page?: number;
    readonly limit?: number;
    readonly totalPages?: number;
  };
}

export interface FetchKqxsoDrawsOptions {
  readonly apiUrl?: string;
  readonly timeoutMs?: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly pageLimit?: number;
}

function todayVnDateStr(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** kqxso API: endDate là exclusive — dùng ngày mai để gồm hết hôm nay. */
function exclusiveEndDateForVnToday(now = new Date()): string {
  const today = todayVnDateStr(now);
  const [year, month, day] = today.split('-').map(Number);
  const utc = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + 1));
  return utc.toISOString().slice(0, 10);
}

export function resolveKqxsoDrawAt(raw: KqxsoApiDraw): string {
  const original = raw.metadata?.originalTime?.trim();
  if (original !== undefined && original.length > 0) {
    return original;
  }
  return raw.drawAt;
}

export function normalizeKqxsoDraw(raw: KqxsoApiDraw): Bingo18RawDraw {
  return {
    drawAt: resolveKqxsoDrawAt(raw),
    winningResult: raw.winningResult,
  };
}

export function isOnOrAfterKqxsoCutover(drawAt: string, cutover = KQXSO_BINGO18_CUTOVER_DATE): boolean {
  const day = drawAt.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  return day !== undefined && day >= cutover;
}

export function isBeforeKqxsoCutover(drawAt: string, cutover = KQXSO_BINGO18_CUTOVER_DATE): boolean {
  return !isOnOrAfterKqxsoCutover(drawAt, cutover);
}

function buildKqxsoUrl(
  baseUrl: string,
  params: { startDate: string; endDate: string; page: number; limit: number },
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('startDate', params.startDate);
  url.searchParams.set('endDate', params.endDate);
  url.searchParams.set('page', String(params.page));
  url.searchParams.set('limit', String(params.limit));
  return url.toString();
}

/** Paginate kqxso.top / ketquasoxo gbingo draws API. */
export async function fetchKqxsoBingo18Draws(
  options: FetchKqxsoDrawsOptions,
): Promise<readonly Bingo18RawDraw[]> {
  const apiUrl = options.apiUrl ?? process.env['COLLECTOR_KQXSO_DRAWS_URL'] ?? DEFAULT_KQXSO_DRAWS_URL;
  const timeoutMs =
    options.timeoutMs ??
    Number(process.env['COLLECTOR_BINGO18_TIMEOUT_MS'] ?? DEFAULT_RETRY_POLICY.requestTimeoutMs);
  const pageLimit = options.pageLimit ?? 1000;

  const all: Bingo18RawDraw[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const requestUrl = buildKqxsoUrl(apiUrl, {
      startDate: options.startDate,
      endDate: options.endDate,
      page,
      limit: pageLimit,
    });

    const { data } = await executeWithRetry(
      () => fetchJsonWithTimeout(requestUrl, (text) => JSON.parse(text) as KqxsoDrawsPage, timeoutMs),
      {
        maxAttempts: DEFAULT_RETRY_POLICY.maxAttempts,
        baseDelayMs: DEFAULT_RETRY_POLICY.baseDelayMs,
        label: `kqxso-fetch-p${String(page)}`,
      },
    );

    const rows = data.data?.data ?? [];
    totalPages = Math.max(1, data.data?.totalPages ?? 1);

    for (const row of rows) {
      all.push(normalizeKqxsoDraw(row));
    }

    page += 1;
  }

  collectorLog(
    `Kqxso draws ${options.startDate}…${options.endDate}: ${String(all.length)} kỳ (${String(totalPages)} trang)`,
  );

  return all;
}

export async function fetchKqxsoBingo18DrawsSinceCutover(
  cutover = process.env['COLLECTOR_KQXSO_SINCE'] ?? KQXSO_BINGO18_CUTOVER_DATE,
): Promise<readonly Bingo18RawDraw[]> {
  const endDate = exclusiveEndDateForVnToday();
  try {
    return await fetchKqxsoBingo18Draws({ startDate: cutover, endDate });
  } catch (err) {
    collectorError('Kqxso fetch failed after retries', err);
    return [];
  }
}

export { todayVnDateStr, exclusiveEndDateForVnToday };
