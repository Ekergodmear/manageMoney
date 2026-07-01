import type { DrawResult } from '../types/draw-result.js';
import type { FreshnessView } from '../diagnostics/types.js';

export const DEFAULT_STALE_DRAW_MS = 10 * 60_000;

export function formatAgeLabel(ageMs: number): string {
  const seconds = Math.max(0, Math.round(ageMs / 1000));
  if (seconds < 60) {
    return `${String(seconds)}s`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${String(minutes * 60)}s`;
  }
  return `${String(Math.round(seconds))}s`;
}

export function buildFreshnessView(
  latestDraw: DrawResult | null,
  now: number,
  staleThresholdMs = DEFAULT_STALE_DRAW_MS,
): FreshnessView {
  if (latestDraw === null) {
    return {
      lastDrawAgeMs: null,
      lastDrawAgeLabel: 'n/a',
      stale: true,
      warning: 'No draw stored',
    };
  }

  const anchor = latestDraw.collectedAt ?? latestDraw.drawAt;
  const lastDrawAgeMs = now - new Date(anchor).getTime();
  const stale = lastDrawAgeMs >= staleThresholdMs;
  const label = formatAgeLabel(lastDrawAgeMs);

  return {
    lastDrawAgeMs,
    lastDrawAgeLabel: label,
    stale,
    warning: stale ? `Last draw older than ${String(Math.round(staleThresholdMs / 1000))}s` : null,
  };
}
