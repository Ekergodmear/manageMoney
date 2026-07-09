import { collectorLog } from '../log/collector-log.js';
import {
  isBingo18BatchPayload,
  parseBingo18DrawBatch,
  parseDrawPayload,
} from '../parser/parse-draw.js';
import type { DrawSink } from '../sink/draw-sink.js';
import type { CollectorState } from '../types/collector-state.js';
import type { DrawResult, RawHttpResponse } from '../types/draw-result.js';
import { dedupeDrawsByKey } from '../util/dedupe.js';

export interface CatchUpResult {
  readonly draws: DrawResult[];
  readonly errors: string[];
  readonly skippedDuplicates: number;
}

/** Resolve draws missing since last persisted state — used on resume and steady polling. */
export async function resolveCatchUpDraws(
  sink: DrawSink,
  state: CollectorState,
  rawPayload: unknown,
  source: string,
  rawResponse: RawHttpResponse | null,
): Promise<CatchUpResult> {
  const parseOptions = { rawResponse };

  if (isBingo18BatchPayload(rawPayload)) {
    const batch = parseBingo18DrawBatch(rawPayload, source, parseOptions);
    const unique = dedupeDrawsByKey(batch.draws);
    const skippedInBatch = batch.draws.length - unique.length;
    const storedCount = await sink.count();
    const lastKey = await sink.getLastDrawKey();

    if (storedCount === 0 || lastKey === null) {
      collectorLog(`Initial backfill: ${String(unique.length)} draws from source`);
      return { draws: unique, errors: batch.errors, skippedDuplicates: skippedInBatch };
    }

    if (unique.length > storedCount) {
      collectorLog(
        `Gap-fill: source ${String(unique.length)} draws, DB ${String(storedCount)} — merging missing`,
      );
      return { draws: unique, errors: batch.errors, skippedDuplicates: skippedInBatch };
    }

    const lastAt = new Date(
      (await sink.findByDrawKey(lastKey))?.drawAt ?? state.lastDraw?.drawAt ?? lastKey,
    ).getTime();
    const newer = unique.filter((d) => new Date(d.drawAt).getTime() > lastAt);
    const skippedOlder = unique.length - newer.length;
    return {
      draws: newer,
      errors: batch.errors,
      skippedDuplicates: skippedInBatch + skippedOlder,
    };
  }

  const parsed = parseDrawPayload(rawPayload, source, parseOptions);
  if (!parsed.success || parsed.draw === undefined) {
    return { draws: [], errors: parsed.errors, skippedDuplicates: 0 };
  }

  const lastKey = await sink.getLastDrawKey();
  if (lastKey === parsed.draw.drawKey) {
    return { draws: [], errors: [], skippedDuplicates: 1 };
  }

  const existing = await sink.findByDrawKey(parsed.draw.drawKey);
  if (existing !== null) {
    return { draws: [], errors: [], skippedDuplicates: 1 };
  }

  return { draws: [parsed.draw], errors: [], skippedDuplicates: 0 };
}
