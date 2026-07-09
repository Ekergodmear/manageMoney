import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';
import { getCollectorApiBase } from '@/features/game-monitor/collector-endpoint';

const JUNE_FROM_KEY = '20260601000000';
const JUNE_TO_KEY = '20260630235959';

export async function loadJune2026Draws(): Promise<readonly CollectorDrawResult[] | null> {
  try {
    const base = getCollectorApiBase();
    const url =
      `${base}/draws/between?fromKey=${encodeURIComponent(JUNE_FROM_KEY)}` +
      `&toKey=${encodeURIComponent(JUNE_TO_KEY)}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { draws?: readonly CollectorDrawResult[] };
    const draws = data.draws ?? [];
    return draws.length > 0 ? draws : null;
  } catch {
    return null;
  }
}
