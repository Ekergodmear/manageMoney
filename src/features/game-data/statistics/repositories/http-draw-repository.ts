import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';
import { getCollectorApiBase } from '@/features/game-monitor/collector-endpoint';
import { collectorDrawToRecord } from '@/features/game-data/statistics/draw-record';
import {
  filterDrawsByChartPeriod,
  getChartPeriodBounds,
  getDrawKeyBounds,
  toGameDateKey,
  toGameOffsetIso,
  type ChartPeriodSelection,
  type ChartTimePeriod,
} from '@/features/game-data/statistics/draw-period';
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
      const fromIso = toGameOffsetIso(from);
      const toIso = toGameOffsetIso(to);
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

  async loadByDrawKeyRange(fromKey: string, toKey: string): Promise<readonly DrawRecord[]> {
    try {
      const url =
        `${this.apiBase}/draws/between?fromKey=${encodeURIComponent(fromKey)}` +
        `&toKey=${encodeURIComponent(toKey)}`;
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

  async loadByGameDay(dateKey: string): Promise<readonly DrawRecord[]> {
    try {
      const response = await fetch(
        `${this.apiBase}/draws/by-day?date=${encodeURIComponent(dateKey)}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!response.ok) {
        return [];
      }
      const data = (await response.json()) as { draws?: readonly CollectorDrawResult[] };
      return mapDraws(data.draws ?? []);
    } catch {
      return [];
    }
  }

  private refineForSelection(
    raw: readonly DrawRecord[],
    selection: ChartPeriodSelection,
  ): readonly DrawRecord[] {
    return filterDrawsByChartPeriod(raw, selection.period, selection.referenceDate);
  }

  async loadForChartSelection(
    selection: ChartPeriodSelection,
  ): Promise<readonly DrawRecord[]> {
    const { period, referenceDate } = selection;

    if (period === 'day') {
      const dateKey = toGameDateKey(referenceDate);
      const byDay = await this.loadByGameDay(dateKey);
      if (byDay.length > 0) {
        return this.refineForSelection(byDay, selection);
      }
    }

    const { fromKey, toKey } = getDrawKeyBounds(period, referenceDate);
    const byRange = await this.loadByDrawKeyRange(fromKey, toKey);
    if (byRange.length > 0) {
      return this.refineForSelection(byRange, selection);
    }

    const { start, end } = getChartPeriodBounds(period, referenceDate);
    const legacy = await this.loadBetween(start, end);
    return this.refineForSelection(legacy, selection);
  }

  async loadForChartPeriod(
    period: ChartTimePeriod,
    referenceDate: Date = new Date(),
  ): Promise<readonly DrawRecord[]> {
    const { fromKey, toKey } = getDrawKeyBounds(period, referenceDate);
    const byKey = await this.loadByDrawKeyRange(fromKey, toKey);
    if (byKey.length > 0) {
      return filterDrawsByChartPeriod(byKey, period, referenceDate);
    }

    const { start, end } = getChartPeriodBounds(period, referenceDate);
    const legacy = await this.loadBetween(start, end);
    return filterDrawsByChartPeriod(legacy, period, referenceDate);
  }

  async loadCollectorDrawCount(): Promise<number | null> {
    try {
      const response = await fetch(`${this.apiBase}/health`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        return null;
      }
      const data = (await response.json()) as { drawCount?: number };
      return typeof data.drawCount === 'number' ? data.drawCount : null;
    } catch {
      return null;
    }
  }

  async loadDailyDrawCounts(): Promise<Readonly<Record<string, number>>> {
    try {
      const response = await fetch(`${this.apiBase}/stats/daily-counts`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        return {};
      }
      const data = (await response.json()) as { counts?: Record<string, number> };
      return data.counts ?? {};
    } catch {
      return {};
    }
  }

  async syncFullHistory(): Promise<{
    ok: boolean;
    message: string;
    added: number;
    storedAfter: number;
    sourceCount: number;
  }> {
    try {
      const response = await fetch(`${this.apiBase}/sync/backfill`, { method: 'POST' });
      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        added?: number;
        storedAfter?: number;
        sourceCount?: number;
      };
      return {
        ok: data.ok === true,
        message: data.message ?? 'Đồng bộ thất bại',
        added: data.added ?? 0,
        storedAfter: data.storedAfter ?? 0,
        sourceCount: data.sourceCount ?? 0,
      };
    } catch {
      return { ok: false, message: 'Không kết nối được Collector', added: 0, storedAfter: 0, sourceCount: 0 };
    }
  }
}

export const httpDrawRepository = new HttpDrawRepository();
