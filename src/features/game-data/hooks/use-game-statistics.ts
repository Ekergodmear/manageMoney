import { useCallback, useEffect, useState } from 'react';

import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { resolvePresetMarkets } from '@/features/game-data/markets/market-catalog';
import { httpDrawRepository } from '@/features/game-data/statistics/repositories/http-draw-repository';
import { StatisticsRepository } from '@/features/game-data/statistics/repositories/statistics-repository';
import type { GameStatisticsSnapshot } from '@/features/game-data/statistics/statistics-types';

const POLL_MS = 60_000;
const DEFAULT_LIMIT = 1000;

const statisticsRepo = new StatisticsRepository(httpDrawRepository);

export interface UseGameStatisticsResult {
  readonly snapshot: GameStatisticsSnapshot | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly refresh: () => void;
}

export function useGameStatistics(
  preset: GamePolicyPreset | undefined,
  options?: { readonly limit?: number; readonly pollMs?: number },
): UseGameStatisticsResult {
  const [snapshot, setSnapshot] = useState<GameStatisticsSnapshot | null>(null);
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
      setLoading(false);
      return;
    }

    const cancelledRef = { current: false };
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const markets = resolvePresetMarkets(preset);
        const result = await statisticsRepo.loadRecentSnapshot({ markets, recentLimit: limit });
        if (!cancelledRef.current) {
          setSnapshot(result);
          setError(result === null ? 'Chưa có dữ liệu draw từ Collector' : null);
        }
      } catch {
        if (!cancelledRef.current) {
          setSnapshot(null);
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

  return { snapshot, loading, error, refresh };
}
