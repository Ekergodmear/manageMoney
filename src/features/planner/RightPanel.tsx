import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Banknote,
  Layers,
  Percent,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { type ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { GenerateResult, PlannerFormValues } from '@/features/planner/plan-service';
import { displayMoney, estimateBankrollHint } from '@/features/planner/schema';
import { formatAmount } from '@/lib/money-format';

function SummaryRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}): ReactNode {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className={`text-sm font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}

export function FormRightPanel({ form }: { form: PlannerFormValues }): ReactNode {
  const bankrollHint = estimateBankrollHint(form);

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Tóm tắt nhanh
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SummaryRow
            icon={<Target className="h-4 w-4" />}
            label="Mục tiêu"
            value={displayMoney(form.targetProfit)}
          />
          <Separator />
          <SummaryRow icon={<Layers className="h-4 w-4" />} label="Số vòng" value={form.roundCount || '—'} />
          <Separator />
          <SummaryRow
            icon={<Sparkles className="h-4 w-4" />}
            label="Hệ số"
            value={form.rewardMultiplier ? `×${form.rewardMultiplier}` : '—'}
          />
          <Separator />
          <SummaryRow
            icon={<Banknote className="h-4 w-4" />}
            label="Cược tối thiểu"
            value={displayMoney(form.minimumBet)}
          />
          <Separator />
          <SummaryRow
            icon={<Wallet className="h-4 w-4" />}
            label="Vốn của bạn"
            value={displayMoney(form.userBankroll)}
            highlight={form.userBankroll.trim() !== ''}
          />
          {bankrollHint !== null ? (
            <>
              <Separator />
              <SummaryRow
                icon={<TrendingUp className="h-4 w-4" />}
                label="Ước tính vốn"
                value={bankrollHint}
              />
            </>
          ) : null}
          {form.winTaxEnabled ? (
            <>
              <Separator />
              <SummaryRow
                icon={<Percent className="h-4 w-4" />}
                label="Thuế"
                value={`${form.winTaxRatePercent}% từ ${form.winTaxThreshold} đ`}
              />
            </>
          ) : null}
        </CardContent>
      </Card>
      <StaticInfoPanels />
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kết quả</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SummaryRow
            icon={<Wallet className="h-4 w-4" />}
            label="Vốn cần"
            value={`${formatAmount(statistics.requiredBankrollAmount)} đ`}
            highlight
          />
          <Separator />
          <SummaryRow
            icon={<Target className="h-4 w-4" />}
            label="Lợi nhuận ước tính"
            value={`${formatAmount(statistics.expectedProfitAmount)} đ`}
          />
          {completedThroughRound > 0 ? (
            <>
              <Separator />
              <SummaryRow
                icon={<Layers className="h-4 w-4" />}
                label="Đã cược"
                value={`${String(completedThroughRound)} / ${String(strategy.rounds.length)}`}
              />
            </>
          ) : null}
        </CardContent>
      </Card>
      <StaticInfoPanels />
    </>
  );
}

function StaticInfoPanels(): ReactNode {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Card className="border-warning bg-warning shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-warning-foreground">
              <AlertTriangle className="h-4 w-4" />
              Lưu ý quan trọng
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-relaxed text-warning-foreground">
            <ul className="list-disc space-y-1 pl-4">
              <li>Kế hoạch dựa trên công thức tối ưu — không đảm bảo thắng.</li>
              <li>Chỉ dùng số vốn bạn chấp nhận mất.</li>
              <li>Chơi có trách nhiệm.</li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <Card className="border-accent/60 bg-accent/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-accent-foreground">
              <Star className="h-4 w-4" />
              Tính năng sắp tới
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              <li>Mô phỏng kịch bản</li>
              <li>Tối ưu khi thiếu vốn</li>
              <li>Tiếp tục kế hoạch</li>
              <li>Phân bổ đa tài khoản</li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
