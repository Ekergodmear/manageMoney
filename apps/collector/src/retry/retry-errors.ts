export type RetryErrorType = 'timeout' | 'http_error' | 'parse_error' | 'network' | 'unknown';

export class CollectorRequestError extends Error {
  readonly errorType: RetryErrorType;

  constructor(errorType: RetryErrorType, message: string) {
    super(message);
    this.name = 'CollectorRequestError';
    this.errorType = errorType;
  }
}

export function classifyFetchError(err: unknown): CollectorRequestError {
  if (err instanceof CollectorRequestError) {
    return err;
  }

  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      return new CollectorRequestError('timeout', 'Request timed out');
    }
    if (err.message.startsWith('HTTP ')) {
      return new CollectorRequestError('http_error', err.message);
    }
    if (err.message.includes('JSON') || err.message.includes('parse')) {
      return new CollectorRequestError('parse_error', err.message);
    }
    return new CollectorRequestError('network', err.message);
  }

  return new CollectorRequestError('unknown', String(err));
}
