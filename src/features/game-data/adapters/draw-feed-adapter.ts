import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';
import { getCollectorApiBase } from '@/features/game-monitor/collector-endpoint';

export async function fetchLatestDraw(): Promise<CollectorDrawResult | null> {
  try {
    const response = await fetch(`${getCollectorApiBase()}/draws/latest`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { draw?: CollectorDrawResult | null };
    return data.draw ?? null;
  } catch {
    return null;
  }
}
