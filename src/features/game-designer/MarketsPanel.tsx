import type { MarketDefinition } from '@/features/game-data/markets/market-definition';
import type { MarketFrequencyStat } from '@/features/game-data/statistics/statistics-types';
import {
  formatHitRate,
  formatHitRateDelta,
} from '@/features/game-data/statistics/statistics-format';
import { formatExpectedReturn, formatHouseEdge } from '@/features/game-data/markets/market-metrics';
import { groupMarketsByType } from '@/features/game-designer/preset-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercent } from '@/features/planner/plan-display';

interface MarketsPanelProps {
  readonly markets: readonly MarketDefinition[];
  readonly observedStats?: readonly MarketFrequencyStat[];
  readonly readOnly?: boolean;
}

export function MarketsPanel({
  markets,
  observedStats,
  readOnly = true,
}: MarketsPanelProps): React.ReactNode {
  const { totals, flowers, sizes } = groupMarketsByType(markets);
  const statsById = new Map((observedStats ?? []).map((s) => [s.marketId, s]));

  if (markets.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold">Markets</CardTitle>
        {readOnly ? (
          <p className="text-xs text-muted-foreground">
            Định nghĩa market — hệ số và xác suất lý thuyết.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        {totals.length > 0 ? (
          <MarketGroup title="Tổng" markets={totals} statsById={statsById} />
        ) : null}
        {flowers.length > 0 ? (
          <MarketGroup title="Hoa" markets={flowers} statsById={statsById} />
        ) : null}
        {sizes.length > 0 ? (
          <MarketGroup title="Tài / Xỉu" markets={sizes} statsById={statsById} />
        ) : null}
      </CardContent>
    </Card>
  );
}

function MarketGroup({
  title,
  markets,
  statsById,
}: {
  readonly title: string;
  readonly markets: readonly MarketDefinition[];
  readonly statsById: ReadonlyMap<string, MarketFrequencyStat>;
}): React.ReactNode {
  const hasObserved = statsById.size > 0;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="max-h-48 overflow-y-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/80 text-xs">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">Market</th>
              <th className="px-2 py-1.5 text-right font-medium">×</th>
              <th className="px-2 py-1.5 text-right font-medium">P</th>
              <th className="px-2 py-1.5 text-right font-medium">EV</th>
              <th className="px-2 py-1.5 text-right font-medium">Edge</th>
              {hasObserved ? (
                <>
                  <th className="px-2 py-1.5 text-right font-medium">Observed</th>
                  <th className="px-2 py-1.5 text-right font-medium">Δ</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => {
              const observed = statsById.get(m.id);
              return (
                <tr key={m.id} className="border-t border-border/60">
                  <td className="px-2 py-1">{m.label}</td>
                  <td className="px-2 py-1 text-right font-mono tabular-nums">{m.multiplier}</td>
                  <td className="px-2 py-1 text-right font-mono text-xs text-muted-foreground tabular-nums">
                    {formatPercent(m.probability * 100)}%
                  </td>
                  <td className="px-2 py-1 text-right font-mono text-xs tabular-nums">
                    {formatExpectedReturn(m.expectedReturn)}
                  </td>
                  <td className="px-2 py-1 text-right font-mono text-xs text-muted-foreground tabular-nums">
                    {formatHouseEdge(m.houseEdge)}
                  </td>
                  {hasObserved ? (
                    <>
                      <td className="px-2 py-1 text-right font-mono text-xs tabular-nums">
                        {observed !== undefined ? formatHitRate(observed.actualHitRate) : '—'}
                      </td>
                      <td className="px-2 py-1 text-right font-mono text-xs tabular-nums">
                        {observed !== undefined ? formatHitRateDelta(observed.hitRateDelta) : '—'}
                      </td>
                    </>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
