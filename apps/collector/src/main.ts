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

void collector.start();
void http.listen();

function shutdown(): void {
  collectorLog('Shutting down...');
  void Promise.all([collector.stop(), http.close()]).then(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
