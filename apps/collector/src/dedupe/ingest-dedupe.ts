import type { DrawResult } from '../types/draw-result.js';
import { dedupeDrawsByKey, filterNewDraws } from '../util/dedupe.js';

export interface IngestDedupeResult {
  readonly draws: readonly DrawResult[];
  readonly skippedDuplicates: number;
}

/**
 * Normalize an incoming batch before persistence:
 * 1. Deduplicate within batch (last wins per drawKey)
 * 2. Drop keys already stored
 * 3. Sort chronologically for stable out-of-order ingest
 */
export function prepareDrawsForIngest(
  draws: readonly DrawResult[],
  knownDrawKeys: ReadonlySet<string>,
): IngestDedupeResult {
  const batchUnique = dedupeDrawsByKey(draws);
  const skippedInBatch = draws.length - batchUnique.length;
  const novel = filterNewDraws(batchUnique, knownDrawKeys);
  const skippedKnown = batchUnique.length - novel.length;
  return {
    draws: novel,
    skippedDuplicates: skippedInBatch + skippedKnown,
  };
}

export function countDuplicateKeys(
  draws: readonly DrawResult[],
  knownDrawKeys: ReadonlySet<string>,
): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const draw of draws) {
    if (knownDrawKeys.has(draw.drawKey) || seen.has(draw.drawKey)) {
      duplicates += 1;
      continue;
    }
    seen.add(draw.drawKey);
  }
  return duplicates;
}
