import { ArrowLeft, Sparkles, TrendingDown } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  bankrollShortfall,
  runAllImproveOptions,
  runImproveForMode,
  type ImproveMode,
  type ImproveOption,
} from '@/features/improve/improve-service';
import type { GenerateResult, PlannerFormValues } from '@/features/planner/plan-service';
import { formatAmount } from '@/lib/money-format';
import { cn } from '@/lib/utils';

const MODES: { id: ImproveMode; hint: string }[] = [
  { id: 'fit-bankroll', hint: 'Tự tìm vòng + lợi nhuận vừa vốn' },
  { id: 'keep-profit', hint: '100k → giảm 500 → 400 → 300 vòng' },
  { id: 'keep-rounds', hint: '500 vòng → giảm 100k → 90k → 80k' },
  { id: 'reduce-both', hint: 'Giảm đồng thời vòng và lợi nhuận' },
  { id: 'fit-max-bet', hint: 'Cược lớn nhất không vượt ngưỡng' },
];

interface ImproveScreenProps {
  readonly formValues: PlannerFormValues;
  readonly generated: GenerateResult;
  readonly completedThroughRound?: number;
  readonly onApply: (option: ImproveOption) => void;
  readonly onBack: () => void;
}

export function ImproveScreen({
  formValues,
  generated,
  completedThroughRound = 0,
  onApply,
  onBack,
}: ImproveScreenProps): ReactNode {
  const [activeMode, setActiveMode] = useState<ImproveMode>('fit-bankroll');
  const [maxBetInput, setMaxBetInput] = useState(
    String(generated.statistics.maximumBetAmount),
  );

  const maxBetLimit = useMemo(() => {
    const parsed = Number(maxBetInput.replace(/\D/g, ''));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }, [maxBetInput]);

  const context = useMemo(
    () => ({
      formValues,
      generated,
      ...(maxBetLimit !== undefined ? { maxBetLimit } : {}),
    }),
    [formValues, generated, maxBetLimit],
  );

  const allOptions = useMemo(() => runAllImproveOptions(context), [context]);
  const modeOption = useMemo(
    () => runImproveForMode(context, activeMode),
    [context, activeMode],
  );

  const shortfall = bankrollShortfall(generated);
  const { statistics, userBankroll } = generated;

  return (
    <div className="w-full max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Improve</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Có plan sẵn — engine tìm phương án khả thi trong giới hạn vốn.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
      </div>

      <Card className="border-warning/50 bg-warning/10">
        <CardContent className="space-y-2 p-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <span>
              Vốn cần: <strong>{formatAmount(statistics.requiredBankrollAmount)} đ</strong>
            </span>
            {userBankroll !== null ? (
              <span>
                Vốn có: <strong>{formatAmount(userBankroll)} đ</strong>
              </span>
            ) : null}
          </div>
          {shortfall !== null ? (
            <p className="flex items-center gap-2 font-medium text-warning-foreground">
              <TrendingDown className="h-4 w-4" />
              Thiếu {formatAmount(shortfall)} đ
            </p>
          ) : (
            <p className="text-muted-foreground">
              Vốn đủ — vẫn có thể tối ưu để giảm rủi ro hoặc cược max.
            </p>
          )}
          {completedThroughRound > 0 ? (
            <p className="text-xs text-muted-foreground">
              Đang chơi vòng {completedThroughRound} — áp dụng sẽ cập nhật kế hoạch (tiến độ giữ
              nguyên nếu còn trong phạm vi).
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {MODES.map((mode) => (
          <button key={mode.id} type="button" onClick={() => setActiveMode(mode.id)}>
            <Badge
              variant={activeMode === mode.id ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1.5"
            >
              {mode.hint.split('→')[0]?.trim() ?? mode.id}
            </Badge>
          </button>
        ))}
      </div>

      {activeMode === 'fit-max-bet' ? (
        <div className="space-y-2">
          <Label htmlFor="max-bet-limit">Cược tối đa cho phép (đ)</Label>
          <Input
            id="max-bet-limit"
            value={maxBetInput}
            onChange={(e) => setMaxBetInput(e.target.value)}
            placeholder="500.000"
          />
        </div>
      ) : null}

      {modeOption !== null ? (
        <OptionCard option={modeOption} highlighted onApply={() => onApply(modeOption)} />
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-5 text-sm text-muted-foreground">
            Không tìm được phương án cho mode này. Thử mode khác hoặc điều chỉnh vốn / cược max.
          </CardContent>
        </Card>
      )}

      {allOptions.length > 1 ? (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Tất cả phương án ({allOptions.length})
          </h3>
          <div className="grid gap-2">
            {allOptions.map((option) => (
              <OptionCard
                key={`${option.id}-${String(option.result.request.roundCount)}`}
                option={option}
                highlighted={false}
                onApply={() => onApply(option)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OptionCard({
  option,
  highlighted,
  onApply,
}: {
  option: ImproveOption;
  highlighted: boolean;
  onApply: () => void;
}): ReactNode {
  const { result, label, description, explanation } = option;
  return (
    <Card className={cn(highlighted && 'border-primary/40 shadow-sm')}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>Vốn cần: {formatAmount(result.statistics.requiredBankrollAmount)} đ</span>
          <span>Cược max: {formatAmount(result.statistics.maximumBetAmount)} đ</span>
          {explanation.roundsReducedBy > 0 ? (
            <span>−{explanation.roundsReducedBy} vòng</span>
          ) : null}
          {explanation.profitReducedBy > 0 ? (
            <span>−{formatAmount(explanation.profitReducedBy)} đ lợi nhuận</span>
          ) : null}
        </div>
        <Button size="sm" onClick={onApply}>
          Áp dụng phương án này
        </Button>
      </CardContent>
    </Card>
  );
}
