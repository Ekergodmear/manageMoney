import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import type { Collector } from '../collector.js';
import { getCollectorVersion } from './collector-version.js';
import { buildCollectorHealth } from '../health/collector-health.js';
import { collectorLog } from '../log/collector-log.js';
import type { DrawSink } from '../sink/draw-sink.js';
import type { DrawResult } from '../types/draw-result.js';
import { buildTodayStats, todayDatePrefix } from './today-stats.js';

export interface CollectorHttpOptions {
  readonly sink: DrawSink;
  readonly collector: Collector;
  readonly adapterId: string;
  readonly port?: number;
  readonly corsOrigin?: string;
}

export interface DashboardPayload {
  readonly generatedAt: string;
  readonly collector: ReturnType<typeof getCollectorVersion>;
  readonly health: Record<string, unknown>;
  readonly latestDraw: DrawResult | null;
  readonly todayStats: ReturnType<typeof buildTodayStats>;
}

function sendJson(res: ServerResponse, status: number, body: unknown, corsOrigin: string): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(payload);
}

async function buildHealthPayload(
  sink: DrawSink,
  adapterId: string,
): Promise<Record<string, unknown>> {
  const [state, drawCount, latestDraw] = await Promise.all([
    sink.loadCollectorState(),
    sink.count(),
    sink.findLatest(),
  ]);
  const health = buildCollectorHealth(state, adapterId, drawCount, latestDraw);
  return {
    status: health.status,
    overall: health.status === 'running' ? 'healthy' : health.status,
    lastPollAt: health.lastPollAt,
    lastSuccessAt: health.lastSuccessAt,
    averageLatencyMs: health.averageLatencyMs,
    failureCount: health.failureCount,
    activeAdapterId: health.activeAdapterId,
    drawCount: health.drawCount,
    lastDrawKey: health.lastDrawKey,
  };
}

async function buildTodayStatsPayload(sink: DrawSink, generatedAt: string) {
  const date = todayDatePrefix(7);
  const rows = await sink.getTodayDrawRows(date);
  return buildTodayStats(rows, date, generatedAt);
}

export async function buildDashboardPayload(
  sink: DrawSink,
  adapterId: string,
): Promise<DashboardPayload> {
  const generatedAt = new Date().toISOString();
  const [health, latestDraw, todayStats] = await Promise.all([
    buildHealthPayload(sink, adapterId),
    sink.findLatest(),
    buildTodayStatsPayload(sink, generatedAt),
  ]);
  return {
    generatedAt,
    collector: getCollectorVersion(),
    health,
    latestDraw,
    todayStats,
  };
}

export function createCollectorHttpServer(options: CollectorHttpOptions) {
  const port = options.port ?? Number(process.env['COLLECTOR_HTTP_PORT'] ?? 8788);
  const corsOrigin =
    options.corsOrigin ?? process.env['COLLECTOR_HTTP_CORS'] ?? 'http://localhost:5173';

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? '/';
    const method = req.method ?? 'GET';

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    if (method !== 'GET') {
      sendJson(res, 405, { error: 'Method not allowed' }, corsOrigin);
      return;
    }

    void routeGet(url, res, options, corsOrigin).catch((err: unknown) => {
      collectorLog(`HTTP error ${url}: ${err instanceof Error ? err.message : String(err)}`);
      sendJson(res, 500, { error: 'Internal server error' }, corsOrigin);
    });
  });

  return {
    listen(): Promise<void> {
      return new Promise((resolve) => {
        server.listen(port, () => {
          collectorLog(`HTTP read API on http://localhost:${String(port)}`);
          resolve();
        });
      });
    },
    close(): Promise<void> {
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err !== undefined) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },
  };
}

async function routeGet(
  url: string,
  res: ServerResponse,
  options: CollectorHttpOptions,
  corsOrigin: string,
): Promise<void> {
  const { sink, adapterId } = options;

  if (url === '/dashboard' || url === '/dashboard/') {
    sendJson(res, 200, await buildDashboardPayload(sink, adapterId), corsOrigin);
    return;
  }

  if (url === '/health' || url === '/health/') {
    sendJson(res, 200, await buildHealthPayload(sink, adapterId), corsOrigin);
    return;
  }

  if (url === '/draws/latest' || url === '/draws/latest/') {
    const draw = await sink.findLatest();
    sendJson(res, 200, { draw }, corsOrigin);
    return;
  }

  if (url.startsWith('/draws/recent')) {
    const parsed = new URL(url, 'http://localhost');
    const limitRaw = parsed.searchParams.get('limit') ?? '1000';
    const limit = Math.max(1, Math.min(Number.parseInt(limitRaw, 10) || 1000, 50_000));
    const draws = await sink.findRecent(limit);
    sendJson(res, 200, { draws, limit, count: draws.length }, corsOrigin);
    return;
  }

  if (url.startsWith('/draws/between')) {
    const parsed = new URL(url, 'http://localhost');
    const from = parsed.searchParams.get('from');
    const to = parsed.searchParams.get('to');
    if (from === null || to === null || from === '' || to === '') {
      sendJson(res, 400, { error: 'from and to query params required (ISO datetime)' }, corsOrigin);
      return;
    }
    const draws = await sink.findBetween(from, to);
    sendJson(res, 200, { draws, from, to, count: draws.length }, corsOrigin);
    return;
  }

  if (url === '/stats/today' || url === '/stats/today/') {
    const generatedAt = new Date().toISOString();
    sendJson(res, 200, await buildTodayStatsPayload(sink, generatedAt), corsOrigin);
    return;
  }

  sendJson(res, 404, { error: 'Not found' }, corsOrigin);
}
