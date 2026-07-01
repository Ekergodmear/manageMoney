import { CollectorRequestError } from '../retry/retry-errors.js';
import { DEFAULT_RETRY_POLICY } from '../retry/retry-policy.js';
import type { RawHttpResponse } from '../types/draw-result.js';

export interface FetchJsonResult<T> {
  readonly data: T;
  readonly rawResponse: RawHttpResponse;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export async function fetchJsonWithTimeout<T>(
  url: string,
  parse: (text: string) => T,
  timeoutMs: number = DEFAULT_RETRY_POLICY.requestTimeoutMs,
): Promise<FetchJsonResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

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
      throw new CollectorRequestError(
        'http_error',
        `HTTP ${String(response.status)} ${response.statusText}`,
      );
    }

    try {
      return { data: parse(body), rawResponse };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'JSON parse failed';
      throw new CollectorRequestError(
        'parse_error',
        err instanceof SyntaxError ? `JSON parse error: ${message}` : message,
      );
    }
  } catch (err) {
    if (err instanceof CollectorRequestError) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new CollectorRequestError('timeout', `Request timed out after ${String(timeoutMs)}ms`);
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new CollectorRequestError('network', message);
  } finally {
    clearTimeout(timer);
  }
}
