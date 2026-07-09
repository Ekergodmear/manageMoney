import type { DrawSourceAdapter } from '../adapter/draw-source-adapter.js';
import { collectorLog } from '../log/collector-log.js';
import { isBingo18BatchPayload, parseBingo18DrawBatch } from '../parser/parse-draw.js';
import type { DrawSink } from '../sink/draw-sink.js';
import { dedupeDrawsByKey } from '../util/dedupe.js';

export interface SyncHistoryResult {
  readonly ok: boolean;
  readonly sourceCount: number;
  readonly storedBefore: number;
  readonly storedAfter: number;
  readonly added: number;
  readonly errors: readonly string[];
  readonly message: string;
}

/** Fetch bingo18 data.json and merge all missing draws into SQLite (UNIQUE on draw_key). */
export async function syncFullDrawHistory(
  sink: DrawSink,
  adapter: DrawSourceAdapter,
): Promise<SyncHistoryResult> {
  const storedBefore = await sink.count();
  const fetch = await adapter.fetchLatest();

  if (fetch === null) {
    return {
      ok: false,
      sourceCount: 0,
      storedBefore,
      storedAfter: storedBefore,
      added: 0,
      errors: ['Adapter returned null'],
      message: 'Không tải được nguồn bingo18',
    };
  }

  if (!isBingo18BatchPayload(fetch.rawPayload)) {
    return {
      ok: false,
      sourceCount: 0,
      storedBefore,
      storedAfter: storedBefore,
      added: 0,
      errors: ['Payload is not bingo18 batch'],
      message: 'Adapter không trả danh sách bingo18',
    };
  }

  const batch = parseBingo18DrawBatch(fetch.rawPayload, adapter.id, {
    rawResponse: fetch.rawResponse,
  });
  const unique = dedupeDrawsByKey(batch.draws);

  if (unique.length === 0) {
    return {
      ok: false,
      sourceCount: 0,
      storedBefore,
      storedAfter: storedBefore,
      added: 0,
      errors: batch.errors,
      message: 'Nguồn không có kỳ nào',
    };
  }

  collectorLog(
    `Sync history: source ${String(unique.length)} draws, DB ${String(storedBefore)} before merge`,
  );

  await sink.appendMany(unique);

  const storedAfter = await sink.count();
  const added = storedAfter - storedBefore;

  collectorLog(
    `Sync history done: +${String(added)} draws → ${String(storedAfter)} total in DB`,
  );

  return {
    ok: true,
    sourceCount: unique.length,
    storedBefore,
    storedAfter,
    added,
    errors: batch.errors,
    message:
      added > 0
        ? `Đã bổ sung ${String(added)} kỳ (tổng ${String(storedAfter)}/${String(unique.length)} từ nguồn)`
        : `Đã đủ dữ liệu (${String(storedAfter)} kỳ)`,
  };
}
