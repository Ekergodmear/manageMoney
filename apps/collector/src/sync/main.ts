import { createAdapterFromEnv } from '../collector.js';
import { collectorLog } from '../log/collector-log.js';
import { SqliteDrawSink } from '../sink/sqlite-draw-sink.js';
import { syncFullDrawHistory } from '../sync/sync-full-history.js';

const dbPath = process.env['COLLECTOR_DB_PATH'] ?? './data/draws.db';

async function main(): Promise<void> {
  const sink = new SqliteDrawSink(dbPath);
  const adapter = createAdapterFromEnv();
  try {
    const result = await syncFullDrawHistory(sink, adapter);
    console.log(result.message);
    console.log(
      `Nguồn: ${String(result.sourceCount)} · Trước: ${String(result.storedBefore)} · Sau: ${String(result.storedAfter)} · Thêm: ${String(result.added)}`,
    );
    if (result.errors.length > 0) {
      console.warn('Cảnh báo parse:', result.errors.join('; '));
    }
    process.exit(result.ok ? 0 : 1);
  } finally {
    await sink.close();
    collectorLog('Sync CLI done');
  }
}

void main().catch((err: unknown) => {
  console.error('[Collector] Sync failed —', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
