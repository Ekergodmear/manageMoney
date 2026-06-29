import type { DrawResult } from '../types/draw-result.js';

/** Filter draws not yet stored — by drawNumber. */
export function filterNewDraws(
  draws: readonly DrawResult[],
  knownDrawNumbers: ReadonlySet<string>,
): DrawResult[] {
  return draws.filter((d) => !knownDrawNumbers.has(d.drawNumber));
}

/** Deduplicate within batch by drawNumber (keeps last occurrence). */
export function dedupeDrawsByNumber(draws: readonly DrawResult[]): DrawResult[] {
  const byNumber = new Map<string, DrawResult>();
  for (const draw of draws) {
    byNumber.set(draw.drawNumber, draw);
  }
  return [...byNumber.values()].sort(
    (a, b) => new Date(a.drawTime).getTime() - new Date(b.drawTime).getTime(),
  );
}
