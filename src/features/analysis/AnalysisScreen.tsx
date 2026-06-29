import { simulateWinAtRound } from '@stake/constraint-engine';
import { useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { accumulatedAtRound } from '@/features/planner/plan-display';
import type { GenerateResult } from '@/features/planner/plan-service';
import type { Session } from '@/features/session/session-domain';
import { computeSessionStatistics } from '@/features/session/session-domain';
import { formatAmount } from '@/lib/money-format';

interface AnalysisScreenProps {
  readonly generated: GenerateResult | null;
  readonly completedThroughRound: number;
  readonly history: readonly Session[];
  readonly onOpenImprove?: () => void;
}

export function AnalysisScreen({
  generated,
  completedThroughRound,
  history,
  onOpenImprove,
}: AnalysisScreenProps): ReactNode {
  const totalRounds = generated?.strategy.rounds.length ?? 1;
  const [winRound, setWinRound] = useState(
    Math.max(1, Math.min(completedThroughRound || 1, totalRounds)),
  );

  const simulation = useMemo(() => {
    if (generated === null) {
      return null;
    }
    const result = simulateWinAtRound(generated.strategy, winRound);
    if (result.kind === 'failure') {
      return null;
    }
    return result.value;
  }, [generated, winRound]);

  const stats = useMemo(() => {
    const sessions = history.length;
    const wins = history.filter((h) => h.status === 'won').length;
    const losses = history.filter((h) => h.status === 'lost' || h.status === 'stopped').length;
    let totalBet = 0;
    let totalProfit = 0;
    for (const s of history) {
      const st = computeSessionStatistics(s);
      totalBet += st.totalCapital;
      totalProfit += s.profitAmount ?? 0;
    }
    const roi = totalBet > 0 ? (totalProfit / totalBet) * 100 : 0;
    return { sessions, wins, losses, totalBet, roi };
  }, [history]);

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Insights</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mô phỏng nếu thắng ở vòng X và thống kê phiên đã chơi.
        </p>
      </div>

      {generated !== null ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mô phỏng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Nếu thắng ở vòng</span>
                <span className="font-bold">{winRound}</span>
              </div>
              <input
                type="range"
                min={1}
                max={totalRounds}
                value={winRound}
                onChange={(e) => setWinRound(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>{totalRounds}</span>
              </div>
            </div>

            {simulation !== null ? (
              <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Lời</p>
                  <p className="text-lg font-bold text-success-foreground">
                    +{formatAmount(simulation.profitAmount)} đ
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Đã chi</p>
                  <p className="text-lg font-bold">
                    {formatAmount(simulation.requiredBankrollAmount)} đ
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">ROI</p>
                  <p className="text-lg font-bold">
                    {simulation.requiredBankrollAmount > 0
                      ? `${((simulation.profitAmount / simulation.requiredBankrollAmount) * 100).toFixed(1)}%`
                      : '—'}
                  </p>
                </div>
              </div>
            ) : null}

            {completedThroughRound > 0 ? (
              <p className="text-xs text-muted-foreground">
                Tiến độ hiện tại: đã chi{' '}
                {formatAmount(accumulatedAtRound(generated.strategy.rounds, completedThroughRound))} đ
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Tạo kế hoạch trước để mô phỏng.
          </CardContent>
        </Card>
      )}

      {onOpenImprove !== undefined ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-muted-foreground">
              Thiếu vốn hoặc muốn giảm cược max? Dùng Improve Engine.
            </p>
            <Button variant="outline" size="sm" onClick={onOpenImprove}>
              Mở Capital Planner
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thống kê</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Phiên" value={String(stats.sessions)} />
          <StatCard label="Thắng" value={String(stats.wins)} />
          <StatCard label="Thua" value={String(stats.losses)} />
          <StatCard
            label="ROI"
            value={stats.sessions > 0 ? `${stats.roi.toFixed(1)}%` : '—'}
          />
          <StatCard
            label="Tổng cược"
            value={stats.totalBet > 0 ? `${formatAmount(stats.totalBet)} đ` : '—'}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
