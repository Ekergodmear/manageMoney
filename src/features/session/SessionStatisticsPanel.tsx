import { BarChart3 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Plan, SessionStatistics } from '@/features/session/session-domain';
import {
  computeCapitalEfficiencyPercent,
  computeCapitalUsagePercent,
} from '@/features/session/session-health';
import { formatAmount } from '@/lib/money-format';

interface SessionStatisticsPanelProps {
  readonly stats: SessionStatistics;
  readonly currentPlan?: Plan | null;
}

export function SessionStatisticsPanel({
  stats,
  currentPlan = null,
}: SessionStatisticsPanelProps): ReactNode {
  const usage = currentPlan !== null ? computeCapitalUsagePercent(currentPlan) : null;
  const efficiency =
    currentPlan !== null ? computeCapitalEfficiencyPercent(currentPlan) : null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4" />
          Thống kê
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {usage !== null ? (
          <StatRow label="Capital usage" value={`${String(usage)}%`} highlight />
        ) : null}
        {efficiency !== null ? (
          <StatRow label="Capital efficiency" value={`${String(efficiency)}%`} highlight />
        ) : null}
        <StatRow label="Vòng" value={String(stats.roundsPlayed)} />
        <StatRow label="Plans" value={String(stats.planCount)} />
        <StatRow label="Continue" value={String(stats.continueCount)} />
        <StatRow label="Cải thiện" value={String(stats.improveCount)} />
        <StatRow label="Cược cao nhất" value={`${formatAmount(stats.highestBet)} đ`} />
        <StatRow label="Tổng đã chi" value={`${formatAmount(stats.totalCapital)} đ`} />
      </CardContent>
    </Card>
  );
}

function StatRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}): ReactNode {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={
          highlight
            ? 'text-sm font-bold tabular-nums text-primary'
            : 'text-sm font-semibold tabular-nums'
        }
      >
        {value}
      </span>
    </div>
  );
}
