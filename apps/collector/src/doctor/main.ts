import { createAdapterFromEnv } from '../collector.js';
import {
  assessHealth,
  buildCollectorHealth,
  formatHealthReport,
} from '../health/collector-health.js';
import { SqliteDrawSink } from '../sink/sqlite-draw-sink.js';

const dbPath = process.env['COLLECTOR_DB_PATH'] ?? './data/draws.db';
const adapter = createAdapterFromEnv();

async function main(): Promise<void> {
  const sink = new SqliteDrawSink(dbPath);
  try {
    const state = await sink.loadCollectorState();
    const drawCount = await sink.count();
    const latestDraw = await sink.findLatest();
    const health = buildCollectorHealth(state, adapter.id, drawCount, latestDraw);
    const report = assessHealth(health);
    console.log(formatHealthReport(report));
    process.exit(report.overall === 'healthy' ? 0 : 1);
  } finally {
    await sink.close();
  }
}

void main().catch((err: unknown) => {
  console.error(
    '[Collector] Doctor failed —',
    err instanceof Error ? err.message : String(err),
  );
  process.exit(1);
});
