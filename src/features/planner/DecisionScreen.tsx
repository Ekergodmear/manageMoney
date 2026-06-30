import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, Play, Sparkles, Target, TrendingUp, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GenerateResult } from '@/features/planner/plan-service';
import { formatAmount } from '@/lib/money-format';

interface DecisionScreenProps {
  readonly generated: GenerateResult;
  readonly onEdit: () => void;
  readonly onViewPlan: () => void;
  readonly onStartPlaying?: () => void;
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  hero,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  hero?: boolean;
}): React.ReactNode {
  return (
    <Card className={hero ? 'border-primary/30 bg-accent/20' : undefined}>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2 font-medium text-foreground">
          {icon}
          {label}
        </CardDescription>
        <CardTitle className={hero ? 'text-3xl text-primary' : 'text-xl'}>{value}</CardTitle>
      </CardHeader>
      {hint != null && hint !== '' ? (
        <CardContent className="pt-0 text-xs text-muted-foreground">{hint}</CardContent>
      ) : null}
    </Card>
  );
}

export function DecisionScreen({
  generated,
  onEdit,
  onViewPlan,
  onStartPlaying,
}: DecisionScreenProps): React.ReactNode {
  const { statistics, userBankroll, request } = generated;
  const bankrollShort = userBankroll !== null && userBankroll < statistics.requiredBankrollAmount;
  const targetAmount =
    request.targetProfit.mode === 'fixedAmount' ? request.targetProfit.amount : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <ArrowLeft className="h-4 w-4" />
          Sửa ý định
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Kết quả kế hoạch</h2>
        <p className="text-muted-foreground">Xem tổng quan trước khi vào bảng chi tiết</p>
      </div>

      <motion.div
        className="grid gap-4 sm:grid-cols-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <MetricCard
          hero
          icon={<Wallet className="h-4 w-4 text-primary" />}
          label="Vốn cần chuẩn bị"
          value={`${formatAmount(statistics.requiredBankrollAmount)} đ`}
          hint="Mức vốn tối đa nếu chưa thắng vòng nào"
        />
        {targetAmount !== null ? (
          <MetricCard
            icon={<Target className="h-4 w-4" />}
            label="Mục tiêu"
            value={`${formatAmount(targetAmount)} đ`}
          />
        ) : null}
        <MetricCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Lợi nhuận ước tính"
          value={`${formatAmount(statistics.expectedProfitAmount)} đ`}
        />
        <MetricCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Cược lớn nhất"
          value={`${formatAmount(statistics.maximumBetAmount)} đ`}
        />
      </motion.div>

      <Card>
        <CardContent className="space-y-4 p-6">
          {bankrollShort ? (
            <p className="text-sm text-warning-foreground">
              ⚠ Vốn của bạn thấp hơn mức cần — hãy xem lại trước khi dùng.
            </p>
          ) : (
            <p className="text-sm font-medium text-success-foreground">✓ Kế hoạch đã sẵn sàng.</p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" onClick={onViewPlan}>
              <Sparkles className="h-4 w-4" />
              Xem kế hoạch cược
            </Button>
            {onStartPlaying !== undefined ? (
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={onStartPlaying}
              >
                <Play className="h-4 w-4" />
                Bắt đầu chơi
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
