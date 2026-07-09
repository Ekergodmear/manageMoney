import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';
import type { CollectorHealthResponse } from '@/features/game-monitor/collector-api-types';
import { getCollectorApiBase } from '@/features/game-monitor/collector-endpoint';

import { formatLastDrawLabel } from '@/features/game-data/adapters/draw-period-label';

/** Không có kỳ mới trong khoảng này → coi nguồn đang bảo trì (Bingo18 ~5–10 phút/kỳ). */
export const SOURCE_MAINTENANCE_STALE_MS = 12 * 60_000;

export interface DrawFeedStatus {
  readonly collectorReachable: boolean;
  readonly latestDraw: CollectorDrawResult | null;
  readonly drawStale: boolean;
  readonly lastDrawPeriodLabel: string | null;
  readonly health: CollectorHealthResponse | null;
}

export function isDrawFeedStale(
  draw: CollectorDrawResult | null,
  nowMs: number,
  staleMs: number = SOURCE_MAINTENANCE_STALE_MS,
): boolean {
  if (draw === null) {
    return true;
  }
  const anchor = draw.collectedAt.length > 0 ? draw.collectedAt : draw.drawAt;
  return nowMs - new Date(anchor).getTime() >= staleMs;
}

export async function fetchDrawFeedStatus(
  nowMs: number = Date.now(),
  staleMs: number = SOURCE_MAINTENANCE_STALE_MS,
): Promise<DrawFeedStatus> {
  const base = getCollectorApiBase();
  let collectorReachable = false;
  let health: CollectorHealthResponse | null = null;
  let latestDraw: CollectorDrawResult | null = null;

  try {
    const [healthRes, drawRes] = await Promise.all([
      fetch(`${base}/health`, { headers: { Accept: 'application/json' } }),
      fetch(`${base}/draws/latest`, { headers: { Accept: 'application/json' } }),
    ]);

    if (healthRes.ok) {
      collectorReachable = true;
      health = (await healthRes.json()) as CollectorHealthResponse;
    }

    if (drawRes.ok) {
      const data = (await drawRes.json()) as { draw?: CollectorDrawResult | null };
      latestDraw = data.draw ?? null;
    }
  } catch {
    collectorReachable = false;
  }

  const drawStale = isDrawFeedStale(latestDraw, nowMs, staleMs);
  const lastDrawPeriodLabel =
    latestDraw !== null
      ? formatLastDrawLabel(latestDraw.drawKey, latestDraw.drawAt)
      : null;

  return {
    collectorReachable,
    latestDraw,
    drawStale,
    lastDrawPeriodLabel,
    health,
  };
}
