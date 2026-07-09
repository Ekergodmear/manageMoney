import { createAdapterFromEnv } from '../collector.js';
import { buildCollectorHealthSnapshot } from '../diagnostics/build-snapshot.js';
import { formatDoctorReport } from '../health/format-doctor-report.js';
import { SqliteDrawSink } from '../sink/sqlite-draw-sink.js';

const dbPath = process.env['COLLECTOR_DB_PATH'] ?? './data/draws.db';
const adapter = createAdapterFromEnv();

async function main(): Promise<void> {
  const sink = new SqliteDrawSink(dbPath);
  try {
    const state = await sink.loadCollectorState();
    const drawCount = await sink.count();
    const latestDraw = await sink.findLatest();
    const snapshot = buildCollectorHealthSnapshot({
      state,
      adapterId: adapter.id,
      drawCount,
      latestDraw,
    });
    console.log(formatDoctorReport(snapshot));
    process.exit(snapshot.status === 'healthy' ? 0 : 1);
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
