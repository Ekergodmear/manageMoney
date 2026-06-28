import { type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { accumulatedAtRound } from '@/features/planner/plan-display';
import type { GenerateResult, PlannerFormValues } from '@/features/planner/plan-service';
import { displayMoney, estimateBankrollHint } from '@/features/planner/schema';
import { formatAmount } from '@/lib/money-format';

function SummaryRow({
  label,
  value,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}): ReactNode {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-xs font-semibold ${
          danger ? 'text-destructive' : highlight ? 'text-primary' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function FormRightPanel({ form }: { form: PlannerFormValues }): ReactNode {
  const bankrollHint = estimateBankrollHint(form);

  return (
    <>
      <Card className="shadow-none">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm">Tóm tắt</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <SummaryRow label="Mục tiêu" value={displayMoney(form.targetProfit)} />
          <Separator className="my-1" />
          <SummaryRow label="Số vòng" value={form.roundCount || '—'} />
          <Separator className="my-1" />
          <SummaryRow label="Hệ số" value={form.rewardMultiplier ? `×${form.rewardMultiplier}` : '—'} />
          <Separator className="my-1" />
          <SummaryRow label="Cược min" value={displayMoney(form.minimumBet)} />
          <Separator className="my-1" />
          <SummaryRow
            label="Vốn"
            value={displayMoney(form.userBankroll)}
            highlight={form.userBankroll.trim() !== ''}
          />
          {bankrollHint !== null ? (
            <>
              <Separator className="my-1" />
              <SummaryRow label="Ước tính" value={bankrollHint} />
            </>
          ) : null}
        </CardContent>
      </Card>

      <p className="rounded-lg border border-warning bg-warning px-3 py-2 text-[11px] leading-relaxed text-warning-foreground">
        Kế hoạch không đảm bảo thắng. Chơi có trách nhiệm.
      </p>
    </>
  );
}

export function PlanRightPanel({
  generated,
  completedThroughRound,
}: {
  generated: GenerateResult;
  completedThroughRound: number;
}): ReactNode {
  const { statistics, strategy } = generated;
  const totalRounds = strategy.rounds.length;
  const selectedCount = completedThroughRound;
  const unselectedCount = totalRounds - selectedCount;
  const accumulated = accumulatedAtRound(strategy.rounds, completedThroughRound);
  const remaining = Math.max(0, statistics.requiredBankrollAmount - accumulated);

  return (
    <>
      <Card className="shadow-none">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm">Tổng quan kế hoạch</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <SummaryRow label="Tổng vòng" value={String(totalRounds)} />
          <Separator className="my-1" />
          <SummaryRow label="Đã chọn" value={String(selectedCount)} highlight={selectedCount > 0} />
          <Separator className="my-1" />
          <SummaryRow label="Chưa chọn" value={String(unselectedCount)} />
          <Separator className="my-1" />
          <SummaryRow
            label="Tích lũy hiện tại"
            value={`${formatAmount(accumulated)} đ`}
            highlight={accumulated > 0}
          />
          <Separator className="my-1" />
          <SummaryRow
            label="Còn lại cần chi"
            value={`${formatAmount(remaining)} đ`}
            danger={remaining > 0}
          />
        </CardContent>
      </Card>

      <p className="rounded-lg border border-warning bg-warning px-3 py-2 text-[11px] leading-relaxed text-warning-foreground">
        Kế hoạch dựa trên công thức tối ưu — không đảm bảo kết quả thực tế. Chơi có trách nhiệm.
      </p>

      <Card className="border-accent/50 bg-accent/20 shadow-none">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm">Mẹo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 p-3 pt-0 text-[11px] leading-relaxed text-muted-foreground">
          <p>✓ Tick từng vòng sau khi đã cược để theo dõi tiến độ.</p>
          <p>✓ So sánh vốn của bạn với mức vốn cần trước khi bắt đầu.</p>
          <p>✓ Dùng &quot;Đặt lại&quot; nếu muốn xóa tiến độ đã chọn.</p>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm">Cần hỗ trợ?</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="mb-2 text-[11px] text-muted-foreground">
            Xem hướng dẫn cách đọc bảng cược và theo dõi tiến độ.
          </p>
          <Button variant="outline" size="sm" className="h-8 w-full text-xs" type="button" disabled>
            Xem hướng dẫn
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
