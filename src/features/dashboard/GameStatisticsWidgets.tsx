import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GameStatisticsSnapshot } from '@/features/game-data/statistics/statistics-types';
import {
  formatHitRate,
  formatHitRateDelta,
  formatVariance,
} from '@/features/game-data/statistics/statistics-format';
import { SimpleBarChart } from '@/features/game-monitor/SimpleBarChart';
import { formatPercent } from '@/features/planner/plan-display';

interface GameStatisticsWidgetsProps {
  readonly snapshot: GameStatisticsSnapshot | null;
  readonly loading?: boolean;
  readonly error?: string | null;
}

export function GameStatisticsWidgets({
  snapshot,
  loading = false,
  error = null,
}: GameStatisticsWidgetsProps): ReactNode {
  if (loading && snapshot === null) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Đang tải thống kê draw…
        </CardContent>
      </Card>
    );
  }

  if (snapshot === null) {
    return error !== null ? (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">{error}</CardContent>
      </Card>
    ) : null;
  }

  const totalBars = snapshot.distributions.totals.map((b) => ({
    label: b.label,
    value: b.count,
  }));

  const droughtTop = [...snapshot.markets]
    .sort((a, b) => b.drought - a.drought)
    .slice(0, 5)
    .filter((m) => m.drought > 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Phân bố tổng ({snapshot.totalDraws} kỳ)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <SimpleBarChart items={totalBars} />
        </CardContent>
      </Card>

      {droughtTop.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Drought — chưa xuất hiện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {droughtTop.map((m) => (
              <div key={m.marketId} className="flex items-center justify-between text-sm">
                <span>{m.label}</span>
                <span className="font-mono font-semibold tabular-nums">{m.drought}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Hot / Cold (quan sát lịch sử)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0 text-sm">
          {snapshot.hotCold.hot !== null ? (
            <p>
              🔥 <strong>{snapshot.hotCold.hot.label}</strong> — hit rate cao hơn kỳ vọng{' '}
              {formatHitRateDelta(snapshot.hotCold.hot.hitRateDelta)}
            </p>
          ) : (
            <p className="text-muted-foreground">🔥 Không có market nổi bật theo hit rate.</p>
          )}
          {snapshot.hotCold.cold !== null ? (
            <p>
              ❄ <strong>{snapshot.hotCold.cold.label}</strong> — đã vắng{' '}
              <strong>{snapshot.hotCold.cold.drought}</strong> kỳ
            </p>
          ) : (
            <p className="text-muted-foreground">❄ Không có drought đáng chú ý.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Chỉ mô tả dữ liệu đã xảy ra — không dự đoán kỳ tiếp theo.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Lý thuyết vs thực tế (top variance)
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-4 pt-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-1 text-left font-medium">Market</th>
                <th className="py-1 text-right font-medium">Expected</th>
                <th className="py-1 text-right font-medium">Actual</th>
                <th className="py-1 text-right font-medium">Δ</th>
              </tr>
            </thead>
            <tbody>
              {[...snapshot.markets]
                .sort((a, b) => Math.abs(b.hitRateDelta) - Math.abs(a.hitRateDelta))
                .slice(0, 6)
                .map((m) => (
                  <tr key={m.marketId} className="border-t border-border/50">
                    <td className="py-1.5">{m.label}</td>
                    <td className="py-1.5 text-right font-mono tabular-nums">
                      {formatHitRate(m.expectedHitRate)}
                    </td>
                    <td className="py-1.5 text-right font-mono tabular-nums">
                      {formatHitRate(m.actualHitRate)}
                    </td>
                    <td className="py-1.5 text-right font-mono tabular-nums">
                      {formatHitRateDelta(m.hitRateDelta)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Rolling window</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 text-xs">
          {snapshot.rollingWindows.map((w) => {
            const topVar = [...w.markets].sort((a, b) => b.variance - a.variance)[0];
            return (
              <div key={w.windowSize} className="rounded-lg border border-border/60 p-3">
                <p className="font-medium">
                  {w.windowSize} kỳ gần nhất ({w.drawCount} kỳ)
                </p>
                {topVar !== undefined ? (
                  <p className="mt-1 text-muted-foreground">
                    {topVar.label}: {topVar.observedCount} lần (kỳ vọng{' '}
                    {formatVariance(topVar.expectedCount)}) · hit{' '}
                    {formatHitRate(topVar.actualHitRate)} vs{' '}
                    {formatPercent(topVar.expectedHitRate * 100)}%
                  </p>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
