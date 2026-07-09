import { useCallback, useEffect, useState } from 'react';

import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { resolvePresetMarkets } from '@/features/game-data/markets/market-catalog';
import { httpDrawRepository } from '@/features/game-data/statistics/repositories/http-draw-repository';
import { computeGameStatistics } from '@/features/game-data/statistics/statistics-engine';
import type { DrawRecord, GameStatisticsSnapshot } from '@/features/game-data/statistics/statistics-types';

const POLL_MS = 60_000;
/** Match Collector SQLite cap — bingo18 API has ~19k draws. */
const DEFAULT_LIMIT = 50_000;

export interface UseGameStatisticsResult {
  readonly snapshot: GameStatisticsSnapshot | null;
  readonly draws: readonly DrawRecord[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly refresh: () => void;
}

export function useGameStatistics(
  preset: GamePolicyPreset | undefined,
  options?: { readonly limit?: number; readonly pollMs?: number },
): UseGameStatisticsResult {
  const [snapshot, setSnapshot] = useState<GameStatisticsSnapshot | null>(null);
  const [draws, setDraws] = useState<readonly DrawRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const limit = options?.limit ?? DEFAULT_LIMIT;
  const pollMs = options?.pollMs ?? POLL_MS;

  const refresh = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (preset === undefined) {
      setSnapshot(null);
      setDraws([]);
      setLoading(false);
      return;
    }

    const cancelledRef = { current: false };
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const markets = resolvePresetMarkets(preset);
        const records = await httpDrawRepository.loadRecent(limit);
        if (!cancelledRef.current) {
          setDraws(records);
          setSnapshot(records.length > 0 ? computeGameStatistics(records, markets) : null);
          setError(records.length === 0 ? 'Chưa có dữ liệu draw từ Collector' : null);
        }
      } catch {
        if (!cancelledRef.current) {
          setSnapshot(null);
          setDraws([]);
          setError('Không tải được thống kê draw');
        }
      } finally {
        if (!cancelledRef.current) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [preset, limit, tick]);

  useEffect(() => {
    if (preset === undefined) {
      return;
    }
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
    }, pollMs);
    return () => {
      window.clearInterval(id);
    };
  }, [preset, pollMs]);

  return { snapshot, draws, loading, error, refresh };
}
