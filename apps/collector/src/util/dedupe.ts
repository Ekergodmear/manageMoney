import type { DrawResult } from '../types/draw-result.js';

/** Filter draws not yet stored — by drawKey. */
export function filterNewDraws(
  draws: readonly DrawResult[],
  knownDrawKeys: ReadonlySet<string>,
): DrawResult[] {
  return draws.filter((d) => !knownDrawKeys.has(d.drawKey));
}

/** Deduplicate within batch by drawKey (keeps last occurrence). */
export function dedupeDrawsByKey(draws: readonly DrawResult[]): DrawResult[] {
  const byKey = new Map<string, DrawResult>();
  for (const draw of draws) {
    byKey.set(draw.drawKey, draw);
  }
  return [...byKey.values()].sort(
    (a, b) => new Date(a.drawAt).getTime() - new Date(b.drawAt).getTime(),
  );
}
