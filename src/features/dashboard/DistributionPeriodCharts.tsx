import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartPeriodSelector } from '@/features/dashboard/ChartPeriodSelector';
import { buildSourceMaintenanceCaption } from '@/features/game-data/adapters/draw-period-label';
import { useDrawFeedStatus } from '@/features/game-data/hooks/use-draw-feed-status';
import {
  defaultChartPeriodSelection,
  filterDrawsByChartPeriod,
  formatChartPeriodHeading,
  formatChartPeriodTimeRange,
  toGameDateKey,
  type ChartPeriodSelection,
} from '@/features/game-data/statistics/draw-period';
import { httpDrawRepository } from '@/features/game-data/statistics/repositories/http-draw-repository';
import { buildDistributions } from '@/features/game-data/statistics/snapshots';
import type { DrawRecord } from '@/features/game-data/statistics/statistics-types';
import { SimpleBarChart } from '@/features/game-monitor/SimpleBarChart';

interface DistributionPeriodChartsProps {
  readonly draws: readonly DrawRecord[];
  readonly onDataSynced?: () => void;
}

const FULL_HISTORY_TARGET = 15_000;

export function DistributionPeriodCharts({
  draws,
  onDataSynced,
}: DistributionPeriodChartsProps): ReactNode {
  const [selection, setSelection] = useState<ChartPeriodSelection>(defaultChartPeriodSelection);
  const [periodDraws, setPeriodDraws] = useState<readonly DrawRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [collectorTotal, setCollectorTotal] = useState<number | null>(null);
  const [dailyCounts, setDailyCounts] = useState<Readonly<Record<string, number>>>({});
  const feedStatus = useDrawFeedStatus();

  const { period, referenceDate } = selection;
  const selectedDateKey = toGameDateKey(referenceDate);
  const periodHeading = formatChartPeriodHeading(period, referenceDate);
  const timeRange = formatChartPeriodTimeRange(periodDraws);
  const todayKey = toGameDateKey(new Date());
  const isSelectedToday = period === 'day' && selectedDateKey === todayKey;

  const refreshMeta = useCallback(async (): Promise<void> => {
    const [total, counts] = await Promise.all([
      httpDrawRepository.loadCollectorDrawCount(),
      httpDrawRepository.loadDailyDrawCounts(),
    ]);
    if (total !== null) {
      setCollectorTotal(total);
    }
    setDailyCounts(counts);
  }, []);

  const reloadPeriodDraws = useCallback(async (): Promise<void> => {
    setLoading(true);
    const fetched = await httpDrawRepository.loadForChartSelection(selection);
    const filtered =
      fetched.length > 0
        ? fetched
        : filterDrawsByChartPeriod(draws, selection.period, selection.referenceDate);
    setPeriodDraws(filtered);
    setLoading(false);
  }, [selection, draws]);

  useEffect(() => {
    void refreshMeta();
  }, [refreshMeta]);

  useEffect(() => {
    void reloadPeriodDraws();
  }, [reloadPeriodDraws]);

  const distributions = useMemo(
    () => buildDistributions(periodDraws, { fillBuckets: true }),
    [periodDraws],
  );

  const drawCount = periodDraws.length;
  const needsSync = collectorTotal !== null && collectorTotal < FULL_HISTORY_TARGET;

  const sourceMaintenanceToday =
    isSelectedToday &&
    !loading &&
    drawCount === 0 &&
    feedStatus?.collectorReachable === true &&
    feedStatus.drawStale === true;

  const periodCountLabel = loading
    ? 'Đang tải…'
    : sourceMaintenanceToday
      ? '0 kỳ (đang bảo trì)'
      : `${drawCount.toLocaleString('vi-VN')} kỳ`;

  const emptyPeriodMessage = sourceMaintenanceToday
    ? buildSourceMaintenanceCaption(feedStatus?.lastDrawPeriodLabel ?? null)
    : 'Không có kỳ trong khoảng đã chọn.';
  const emptyFlowerMessage = sourceMaintenanceToday
    ? emptyPeriodMessage
    : 'Không có hoa trong khoảng đã chọn.';

  const totalBars = distributions.totals.map((b) => ({
    label: b.label,
    value: b.count,
  }));

  const flowerBars = distributions.flowers.map((b) => ({
    label: b.label.replace(/^Hoa /, ''),
    value: b.count,
  }));

  const handleSync = (): void => {
    setSyncing(true);
    setSyncMessage(null);
    void (async () => {
      const result = await httpDrawRepository.syncFullHistory();
      setSyncMessage(result.message);
      setSyncing(false);
      await refreshMeta();
      await reloadPeriodDraws();
      onDataSynced?.();
    })();
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Phân bố Tổng &amp; Hoa</CardTitle>
            <p className="mt-1 text-sm font-medium text-foreground">
              {periodHeading} · {periodCountLabel}
              {isSelectedToday && !loading ? ' (đang quay)' : ''}
            </p>
            {timeRange !== null && drawCount > 0 ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Khung giờ kỳ đã quay: {timeRange}
              </p>
            ) : null}
            <p className="mt-1 text-[11px] text-muted-foreground">
              {collectorTotal !== null
                ? `Tổng Collector: ${collectorTotal.toLocaleString('vi-VN')} kỳ`
                : 'Chưa kết nối Collector'}
              {needsSync ? ' · bấm "Tải full lịch sử" để đủ ~19.000 kỳ' : ''}
            </p>
            {syncMessage !== null ? (
              <p className="mt-1 text-[11px] text-foreground">{syncMessage}</p>
            ) : null}
          </div>
          {needsSync ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 text-xs"
              disabled={syncing}
              onClick={handleSync}
            >
              {syncing ? 'Đang tải full…' : 'Tải full lịch sử'}
            </Button>
          ) : null}
        </div>
        <ChartPeriodSelector
          value={selection}
          onChange={setSelection}
          dailyCounts={dailyCounts}
        />
        <p className="text-[10px] text-muted-foreground">
          Số dưới mỗi ngày = kỳ đã lưu (+07). Biểu đồ chỉ tính đúng khoảng bạn chọn.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 p-4 pt-0">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tổng (3–18) · {periodCountLabel}
          </p>
          {totalBars.some((b) => b.value > 0) ? (
            <div className="overflow-x-auto pb-1">
              <SimpleBarChart items={totalBars} className="min-w-[28rem]" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{emptyPeriodMessage}</p>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Hoa (111–666) · {periodCountLabel}
          </p>
          {flowerBars.some((b) => b.value > 0) ? (
            <SimpleBarChart items={flowerBars} />
          ) : (
            <p className="text-sm text-muted-foreground">{emptyFlowerMessage}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
