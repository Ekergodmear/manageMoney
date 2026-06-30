import { ArrowLeft, Sparkles, Target, TrendingUp, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { resolvePresetMarkets } from '@/features/game-data/markets/market-catalog';
import { formatExpectedReturn, formatHouseEdge } from '@/features/game-data/markets/market-metrics';
import { findMarketById } from '@/features/game-data/markets/market-resolver';
import type { PlanCandidate } from '@/features/planning/plan-candidate-types';
import type { GenerateResult } from '@/features/planner/plan-service';
import { formatPercent } from '@/features/planner/plan-display';
import { formatAmount } from '@/lib/money-format';

interface ImproveCandidateReviewScreenProps {
  readonly candidate: PlanCandidate;
  readonly preset?: GamePolicyPreset | undefined;
  readonly parentGenerated?: GenerateResult;
  readonly onBack: () => void;
  readonly onPromote: () => void;
  readonly onDiscard: () => void;
  readonly promoteLabel?: string;
  readonly backLabel?: string;
  readonly subtitle?: string;
}

function MetricCard({
  label,
  value,
  hero,
}: {
  label: string;
  value: string;
  hero?: boolean;
}): React.ReactNode {
  return (
    <Card className={hero ? 'border-primary/30 bg-accent/20' : undefined}>
      <CardHeader className="pb-2">
        <CardDescription className="font-medium text-foreground">{label}</CardDescription>
        <CardTitle className={hero ? 'text-2xl text-primary' : 'text-xl'}>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

export function ImproveCandidateReviewScreen({
  candidate,
  preset,
  parentGenerated,
  onBack,
  onPromote,
  onDiscard,
  promoteLabel = 'Thêm Plan vào session',
  backLabel = 'Quay lại Improve',
  subtitle,
}: ImproveCandidateReviewScreenProps): React.ReactNode {
  const { statistics } = candidate.generated;
  const parentStats = parentGenerated?.statistics;
  const bankrollDelta =
    parentStats !== undefined
      ? statistics.requiredBankrollAmount - parentStats.requiredBankrollAmount
      : 0;
  const market =
    preset !== undefined
      ? findMarketById(resolvePresetMarkets(preset), candidate.marketId)
      : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Xem lại phương án</h2>
        <p className="text-muted-foreground">
          {subtitle ?? `${candidate.label} — xác nhận trước khi thêm Plan mới vào session`}
        </p>
      </div>

      {market !== undefined ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="space-y-1 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Market
            </p>
            <p className="text-xl font-semibold text-primary">{market.label}</p>
            <p className="text-sm text-muted-foreground">
              ×{market.multiplier} · P {formatPercent(market.probability * 100)}% · EV{' '}
              {formatExpectedReturn(market.expectedReturn)} · Edge{' '}
              {formatHouseEdge(market.houseEdge)}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          hero
          label="Vốn cần chuẩn bị"
          value={`${formatAmount(statistics.requiredBankrollAmount)} đ`}
        />
        <MetricCard
          label="Lợi nhuận ước tính"
          value={`${formatAmount(statistics.expectedProfitAmount)} đ`}
        />
        <MetricCard
          label="Cược lớn nhất"
          value={`${formatAmount(statistics.maximumBetAmount)} đ`}
        />
        <MetricCard label="Số vòng" value={String(candidate.generated.strategy.rounds.length)} />
      </div>

      {parentStats !== undefined ? (
        <Card>
          <CardContent className="space-y-3 p-6 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Wallet className="h-4 w-4" />
              So với Plan hiện tại
            </p>
            <p>
              Vốn cần: {formatAmount(parentStats.requiredBankrollAmount)} đ →{' '}
              <strong>{formatAmount(statistics.requiredBankrollAmount)} đ</strong>
              {bankrollDelta !== 0 ? (
                <span
                  className={
                    bankrollDelta < 0 ? ' text-success-foreground' : ' text-warning-foreground'
                  }
                >
                  {' '}
                  ({bankrollDelta < 0 ? '−' : '+'}
                  {formatAmount(Math.abs(bankrollDelta))} đ)
                </span>
              ) : null}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              Cược max: {formatAmount(parentStats.maximumBetAmount)} →{' '}
              {formatAmount(statistics.maximumBetAmount)} đ
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Lợi nhuận: {formatAmount(parentStats.expectedProfitAmount)} →{' '}
              {formatAmount(statistics.expectedProfitAmount)} đ
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={onDiscard}>
          Hủy phương án
        </Button>
        <Button size="lg" onClick={onPromote}>
          <Sparkles className="h-4 w-4" />
          {promoteLabel}
        </Button>
      </div>
    </div>
  );
}
