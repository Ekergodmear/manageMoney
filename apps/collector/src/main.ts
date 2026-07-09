import { Collector, createAdapterFromEnv } from './collector.js';
import { createCollectorHttpServer } from './http/server.js';
import { collectorLog } from './log/collector-log.js';
import { SqliteDrawSink } from './sink/sqlite-draw-sink.js';

const dbPath = process.env['COLLECTOR_DB_PATH'] ?? './data/draws.db';

const sink = new SqliteDrawSink(dbPath);
const adapter = createAdapterFromEnv();
const collector = new Collector({ sink, adapter });

const http = createCollectorHttpServer({
  sink,
  collector,
  adapterId: adapter.id,
});

async function bootstrap(): Promise<void> {
  const shouldSyncOnStart =
    process.env['COLLECTOR_SYNC_ON_START'] === '1' ||
    (adapter.id === 'bingo18' && process.env['COLLECTOR_SYNC_ON_START'] !== '0');

  if (shouldSyncOnStart && adapter.id === 'bingo18') {
    const purged = await sink.purgeDrawsNotFromSource('bingo18');
    if (purged > 0) {
      collectorLog(`Removed ${String(purged)} draw(s) from other adapters`);
    }
    collectorLog('Startup sync: merging full bingo18 history…');
    const result = await collector.syncFullHistory();
    collectorLog(result.message);
  }

  await collector.start();
  await http.listen();
}

void bootstrap();

function shutdown(): void {
  collectorLog('Shutting down...');
  void Promise.all([collector.stop(), http.close()]).then(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
