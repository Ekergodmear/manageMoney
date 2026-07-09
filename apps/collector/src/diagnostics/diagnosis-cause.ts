/** Operator-facing root cause — not a stack trace. */
export type DiagnosisCause =
  | 'network'
  | 'timeout'
  | 'http_error'
  | 'parse_error'
  | 'sqlite_busy'
  | 'unknown';

const CAUSE_LABELS: Record<DiagnosisCause, string> = {
  network: 'Network',
  timeout: 'Timeout',
  http_error: 'HTTP Error',
  parse_error: 'Parse Error',
  sqlite_busy: 'SQLite Busy',
  unknown: 'Unknown',
};

export function formatDiagnosisCause(cause: DiagnosisCause): string {
  return CAUSE_LABELS[cause];
}

export function normalizeDiagnosisCause(raw: string | null | undefined): DiagnosisCause | null {
  if (raw === null || raw === undefined || raw.length === 0) return null;
  switch (raw) {
    case 'network':
    case 'timeout':
    case 'http_error':
    case 'parse_error':
    case 'sqlite_busy':
    case 'unknown':
      return raw;
    default:
      return 'unknown';
  }
}
