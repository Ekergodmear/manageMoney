import { type ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { GenerateResult, PlannerFormValues } from '@/features/planner/plan-service';
import { displayMoney, estimateBankrollHint } from '@/features/planner/schema';
import { formatAmount } from '@/lib/money-format';

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}): ReactNode {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? 'text-primary' : ''}`}>{value}</span>
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

export function ResultRightPanel({
  generated,
  completedThroughRound,
}: {
  generated: GenerateResult;
  completedThroughRound: number;
}): ReactNode {
  const { statistics, strategy } = generated;
  return (
    <>
      <Card className="shadow-none">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm">Kết quả</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <SummaryRow
            label="Vốn cần"
            value={`${formatAmount(statistics.requiredBankrollAmount)} đ`}
            highlight
          />
          <Separator className="my-1" />
          <SummaryRow label="Lợi nhuận" value={`${formatAmount(statistics.expectedProfitAmount)} đ`} />
          {completedThroughRound > 0 ? (
            <>
              <Separator className="my-1" />
              <SummaryRow
                label="Đã cược"
                value={`${String(completedThroughRound)}/${String(strategy.rounds.length)}`}
              />
            </>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
