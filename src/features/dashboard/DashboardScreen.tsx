import { Play, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { accumulatedAtRound } from '@/features/planner/plan-display';
import type { GenerateResult } from '@/features/planner/plan-service';
import type { PlanRecord } from '@/features/session/plan-records';
import { formatAmount } from '@/lib/money-format';

interface DashboardScreenProps {
  readonly userName?: string;
  readonly generated: GenerateResult | null;
  readonly sessionNumber: number;
  readonly sessionStarted: boolean;
  readonly completedThroughRound: number;
  readonly recentPlans: readonly PlanRecord[];
  readonly onContinueSession: () => void;
  readonly onNewPlan: () => void;
  readonly onOpenPlan: (id: number) => void;
}

export function DashboardScreen({
  userName = 'bạn',
  generated,
  sessionNumber,
  sessionStarted,
  completedThroughRound,
  recentPlans,
  onContinueSession,
  onNewPlan,
  onOpenPlan,
}: DashboardScreenProps): ReactNode {
  const hasPlan = generated !== null;
  const accumulated =
    generated !== null ? accumulatedAtRound(generated.strategy.rounds, completedThroughRound) : 0;
  const totalRounds = generated?.strategy.rounds.length ?? 0;
  const lastBet =
    completedThroughRound > 0 && generated !== null
      ? (generated.strategy.rounds[completedThroughRound - 1]?.betAmount ?? 0)
      : 0;

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Xin chào {userName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Biết cần bao nhiêu vốn, khi nào dừng, và cách điều chỉnh nếu thiếu vốn.
        </p>
      </div>

      {hasPlan && sessionStarted ? (
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Đang chơi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Phiên" value={`#${String(sessionNumber)}`} />
              <Stat label="Đã cược" value={`${formatAmount(accumulated)} đ`} />
              <Stat label="Hoàn thành" value={`${String(completedThroughRound)} / ${String(totalRounds)}`} />
              <Stat
                label="Lần cược gần nhất"
                value={lastBet > 0 ? `${formatAmount(lastBet)} đ` : '—'}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onContinueSession}>
                <Play className="h-4 w-4" />
                Tiếp tục phiên
              </Button>
              <Button variant="outline" onClick={onNewPlan}>
                <Plus className="h-4 w-4" />
                Tạo kế hoạch mới
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : hasPlan ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="font-semibold">Kế hoạch đã tạo — chưa bắt đầu phiên</p>
              <p className="text-sm text-muted-foreground">
                Vào <strong>Kế hoạch</strong> để xem tóm tắt và bấm Bắt đầu.
              </p>
            </div>
            <Button variant="outline" onClick={onNewPlan}>
              Mở kế hoạch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <p className="text-sm text-muted-foreground">Chưa có kế hoạch nào. Bắt đầu từ đây.</p>
            <Button onClick={onNewPlan}>
              <Plus className="h-4 w-4" />
              Tạo kế hoạch mới
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Kế hoạch gần đây</h3>
        {recentPlans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có lịch sử — kế hoạch mới sẽ hiện ở đây.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {recentPlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => onOpenPlan(plan.id)}
                className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{plan.label}</p>
                  <StatusBadge status={plan.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.roundCount} vòng · {plan.createdAt.toLocaleDateString('vi-VN')}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: PlanRecord['status'] }): ReactNode {
  const map = {
    ready: { label: 'Sẵn sàng', variant: 'secondary' as const },
    playing: { label: 'Đang chơi', variant: 'default' as const },
    completed: { label: 'Hoàn thành', variant: 'success' as const },
    cancelled: { label: 'Đã hủy', variant: 'muted' as const },
  };
  const item = map[status];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
