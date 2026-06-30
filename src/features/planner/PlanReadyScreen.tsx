import { BarChart3, Download, Play, Table2, Target, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { computeTargetWinRatePercent, formatPercent } from '@/features/planner/plan-display';
import type { GenerateResult } from '@/features/planner/plan-service';
import { formatAmount } from '@/lib/money-format';

interface PlanReadyScreenProps {
  readonly generated: GenerateResult;
  readonly onEdit: () => void;
  readonly onStart: () => void;
  readonly onViewTable: () => void;
  readonly onSimulate: () => void;
  readonly onExport: () => void;
  readonly onPrint?: () => void;
  readonly onImprove?: () => void;
}

export function PlanReadyScreen({
  generated,
  onEdit,
  onStart,
  onViewTable,
  onSimulate,
  onExport,
  onPrint,
  onImprove,
}: PlanReadyScreenProps): ReactNode {
  const { statistics, request, userBankroll } = generated;
  const targetAmount =
    request.targetProfit.mode === 'fixedAmount' ? request.targetProfit.amount : null;
  const winRate = computeTargetWinRatePercent(statistics);
  const bankrollShort = userBankroll !== null && userBankroll < statistics.requiredBankrollAmount;

  return (
    <div className="w-full max-w-3xl space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Kế hoạch đã sẵn sàng</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Xem tóm tắt trước khi bắt đầu phiên hoặc mở bảng chi tiết.
        </p>
      </div>

      <Card className="shadow-md">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <Metric
            icon={<Wallet className="h-4 w-4" />}
            label="Vốn cần"
            value={`${formatAmount(statistics.requiredBankrollAmount)} đ`}
          />
          <Metric
            icon={<Target className="h-4 w-4" />}
            label="Mục tiêu"
            value={targetAmount !== null ? `${formatAmount(targetAmount)} đ` : '—'}
          />
          <Metric
            icon={<BarChart3 className="h-4 w-4" />}
            label="Cược lớn nhất"
            value={`${formatAmount(statistics.maximumBetAmount)} đ`}
          />
          <Metric
            icon={<Target className="h-4 w-4" />}
            label="Tỷ lệ thành công"
            value={`${formatPercent(winRate)}%`}
          />
        </CardContent>
      </Card>

      {bankrollShort ? (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm">
              Thiếu{' '}
              <strong>
                {formatAmount(statistics.requiredBankrollAmount - userBankroll)} đ
              </strong>{' '}
              so với vốn hiện có.
            </p>
            {onImprove !== undefined ? (
              <Button variant="outline" size="sm" onClick={onImprove}>
                Capital Planner
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : onImprove !== undefined ? (
        <Button variant="outline" size="sm" onClick={onImprove}>
          Cải thiện / tối ưu (Capital Planner)
        </Button>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tiếp theo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={onStart}>
            <Play className="h-4 w-4" />
            Bắt đầu
          </Button>
          <Button variant="outline" onClick={onViewTable}>
            <Table2 className="h-4 w-4" />
            Xem bảng cược
          </Button>
          <Button variant="outline" onClick={onSimulate}>
            Mô phỏng
          </Button>
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4" />
            JSON
          </Button>
          {onPrint !== undefined ? (
            <Button variant="outline" onClick={onPrint}>
              In
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Sửa thông số
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}): ReactNode {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
