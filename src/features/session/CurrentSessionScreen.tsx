import { Play, Plus, Download, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { accumulatedAtRound } from '@/features/planner/plan-display';
import type { GenerateResult } from '@/features/planner/plan-service';
import { formatAmount } from '@/lib/money-format';

interface CurrentSessionScreenProps {
  readonly sessionNumber: number;
  readonly generated: GenerateResult;
  readonly completedThroughRound: number;
  readonly startedAt: Date;
  readonly onContinuePlan: () => void;
  readonly onNewPlan: () => void;
  readonly onComingSoon: (message: string) => void;
}

export function CurrentSessionScreen({
  sessionNumber,
  generated,
  completedThroughRound,
  startedAt,
  onContinuePlan,
  onNewPlan,
  onComingSoon,
}: CurrentSessionScreenProps): ReactNode {
  const { strategy, statistics, request } = generated;
  const accumulated = accumulatedAtRound(strategy.rounds, completedThroughRound);
  const remaining = Math.max(0, statistics.requiredBankrollAmount - accumulated);
  const targetAmount =
    request.targetProfit.mode === 'fixedAmount' ? request.targetProfit.amount : null;

  return (
    <div className="w-full space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Phiên đang chơi</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Trung tâm theo dõi phiên — mọi thao tác tiếp theo bắt đầu từ đây.
        </p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Phiên #{String(sessionNumber)}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Bắt đầu{' '}
            {startedAt.toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
            })}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Đã chơi" value={`${String(completedThroughRound)} / ${String(strategy.rounds.length)} vòng`} />
            <Stat label="Đã chi" value={`${formatAmount(accumulated)} đ`} />
            <Stat
              label="Lần cược gần nhất"
              value={
                completedThroughRound > 0
                  ? `${formatAmount(strategy.rounds[completedThroughRound - 1]?.betAmount ?? 0)} đ`
                  : '—'
              }
            />
            <Stat
              label="Mục tiêu"
              value={targetAmount !== null ? `${formatAmount(targetAmount)} đ` : '—'}
            />
            <Stat label="Còn lại cần chi" value={`${formatAmount(remaining)} đ`} highlight />
            <Stat label="Trạng thái" value={completedThroughRound < strategy.rounds.length ? 'Chưa thắng' : 'Hết vòng'} />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button onClick={onContinuePlan}>
              <Play className="h-4 w-4" />
              Tiếp tục
            </Button>
            <Button
              variant="outline"
              onClick={() => onComingSoon('Hoàn thành phiên — sắp ra mắt trong bản cập nhật tới.')}
            >
              <CheckCircle2 className="h-4 w-4" />
              Hoàn thành
            </Button>
            <Button variant="outline" onClick={onNewPlan}>
              <Plus className="h-4 w-4" />
              Tạo kế hoạch mới
            </Button>
            <Button
              variant="outline"
              onClick={() => onComingSoon('Xuất file — sắp ra mắt trong bản cập nhật tới.')}
            >
              <Download className="h-4 w-4" />
              Xuất file
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}): ReactNode {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-primary' : ''}`}>{value}</p>
    </div>
  );
}
