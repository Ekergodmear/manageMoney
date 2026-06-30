import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';
import { getCollectorApiBase } from '@/features/game-monitor/collector-endpoint';
import { collectorDrawToRecord } from '@/features/game-data/statistics/draw-record';
import type { DrawRecord } from '@/features/game-data/statistics/statistics-types';
import type { DrawRepository } from '@/features/game-data/statistics/repositories/draw-repository';

function mapDraws(draws: readonly CollectorDrawResult[]): readonly DrawRecord[] {
  return draws.map(collectorDrawToRecord);
}

export class HttpDrawRepository implements DrawRepository {
  constructor(private readonly apiBase: string = getCollectorApiBase()) {}

  async loadRecent(limit: number): Promise<readonly DrawRecord[]> {
    try {
      const capped = Math.max(1, Math.min(limit, 50_000));
      const response = await fetch(`${this.apiBase}/draws/recent?limit=${String(capped)}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        return [];
      }
      const data = (await response.json()) as { draws?: readonly CollectorDrawResult[] };
      return mapDraws(data.draws ?? []);
    } catch {
      return [];
    }
  }

  async loadBetween(from: Date, to: Date): Promise<readonly DrawRecord[]> {
    try {
      const fromIso = from.toISOString();
      const toIso = to.toISOString();
      const url = `${this.apiBase}/draws/between?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) {
        return [];
      }
      const data = (await response.json()) as { draws?: readonly CollectorDrawResult[] };
      return mapDraws(data.draws ?? []);
    } catch {
      return [];
    }
  }
}

export const httpDrawRepository = new HttpDrawRepository();
