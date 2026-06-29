/** Collector-only logging — not app Logger. */
export function collectorLog(message: string): void {
  const ts = new Date().toISOString();
  console.log(`[Collector] ${ts} ${message}`);
}

export function collectorError(message: string, err?: unknown): void {
  const ts = new Date().toISOString();
  const detail = err instanceof Error ? err.message : err !== undefined ? String(err) : '';
  console.error(`[Collector] ${ts} ${message}${detail ? ` — ${detail}` : ''}`);
}
