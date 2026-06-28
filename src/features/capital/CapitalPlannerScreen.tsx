import { Landmark, Sparkles } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { planCapitalStrategy } from '@/features/capital/capital-planner-service';
import {
  CAPITAL_GOAL_LABELS,
  RISK_LABELS,
  type CapitalGoal,
  type CapitalPlannerResult,
  type CapitalSessionRecommendation,
  type RiskProfile,
} from '@/features/capital/capital-planner-types';
import { PresetPicker } from '@/features/game-designer/PresetPicker';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { applyPresetToForm } from '@/features/game-designer/preset-utils';
import { DEFAULT_PLANNER_FORM } from '@/features/planner/plan-service';
import { formatMoneyFieldValue } from '@/features/planner/schema';
import { formatAmount, parseMoneyPositiveInt } from '@/lib/money-format';
import { cn } from '@/lib/utils';

const GOALS: CapitalGoal[] = ['max-profit', 'longest-play', 'lowest-bet', 'balanced'];
const RISKS: RiskProfile[] = ['conservative', 'normal', 'aggressive'];

const SAFETY_LABELS = {
  safe: 'An toàn',
  tight: 'Vừa phải',
  risky: 'Căng',
} as const;

interface CapitalPlannerScreenProps {
  readonly presets: readonly GamePolicyPreset[];
  readonly activePresetId: string;
  readonly initialBankroll?: string;
  readonly initialStrategy?: CapitalGoal;
  readonly initialRisk?: RiskProfile;
  readonly lastResult?: CapitalPlannerResult | null;
  readonly onPresetSelect: (preset: GamePolicyPreset) => void;
  readonly onGenerate: (input: {
    bankroll: number;
    strategy: CapitalGoal;
    risk: RiskProfile;
    presetId: string;
    result: CapitalPlannerResult;
  }) => void;
  readonly onCreateSession: (recommendation: CapitalSessionRecommendation) => void;
}

function RadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  renderLabel,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  renderLabel: (v: T) => string;
}): ReactNode {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{label}</p>
      <div className="space-y-1">
        {options.map((option) => (
          <label
            key={option}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
              value === option
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted/40',
            )}
          >
            <input
              type="radio"
              name={label}
              checked={value === option}
              onChange={() => onChange(option)}
              className="accent-primary"
            />
            {renderLabel(option)}
          </label>
        ))}
      </div>
    </div>
  );
}

export function CapitalPlannerScreen({
  presets,
  activePresetId,
  initialBankroll = '30.000.000',
  initialStrategy = 'balanced',
  initialRisk = 'normal',
  lastResult = null,
  onPresetSelect,
  onGenerate,
  onCreateSession,
}: CapitalPlannerScreenProps): ReactNode {
  const [bankrollInput, setBankrollInput] = useState(initialBankroll);
  const [strategy, setStrategy] = useState<CapitalGoal>(initialStrategy);
  const [risk, setRisk] = useState<RiskProfile>(initialRisk);
  const [result, setResult] = useState<CapitalPlannerResult | null>(lastResult);
  const [error, setError] = useState<string | null>(null);

  const activePreset = presets.find((p) => p.id === activePresetId);

  function handleGenerate(): void {
    const bankroll = parseMoneyPositiveInt(bankrollInput);
    if (bankroll === null) {
      setError('Nhập vốn hợp lệ');
      return;
    }
    if (activePreset === undefined) {
      setError('Chọn game preset');
      return;
    }
    const baseForm = applyPresetToForm(
      { ...DEFAULT_PLANNER_FORM, userBankroll: bankrollInput },
      activePreset,
    );
    const planned = planCapitalStrategy({
      bankroll,
      presetId: activePresetId,
      baseForm,
      strategy,
      risk,
    });
    if (planned === null) {
      setError('Không tìm được chiến lược khả thi với vốn và game này.');
      setResult(null);
      return;
    }
    setError(null);
    setResult(planned);
    onGenerate({ bankroll, strategy, risk, presetId: activePresetId, result: planned });
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Capital Planner</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Với số vốn hôm nay, engine đề xuất chiến lược chơi — không cần nhập lợi nhuận hay số vòng.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vốn &amp; Game</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="capital-bankroll">Vốn hiện có</Label>
            <Input
              id="capital-bankroll"
              inputMode="numeric"
              value={bankrollInput}
              onChange={(e) =>
                setBankrollInput(formatMoneyFieldValue('userBankroll', e.target.value))
              }
              placeholder="30.000.000"
            />
          </div>
          <PresetPicker
            presets={presets}
            activePresetId={activePresetId}
            onSelect={onPresetSelect}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 p-6">
          <RadioGroup
            label="Mục tiêu"
            options={GOALS}
            value={strategy}
            onChange={setStrategy}
            renderLabel={(g) => CAPITAL_GOAL_LABELS[g]}
          />
          <RadioGroup
            label="Ngân sách rủi ro"
            options={RISKS}
            value={risk}
            onChange={setRisk}
            renderLabel={(r) => RISK_LABELS[r]}
          />
          <Button className="w-full" size="lg" onClick={handleGenerate}>
            <Sparkles className="h-4 w-4" />
            Generate Strategy
          </Button>
          {error !== null ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {result !== null ? (
        <ResultPanel result={result} onCreateSession={onCreateSession} />
      ) : null}
    </div>
  );
}

function ResultPanel({
  result,
  onCreateSession,
}: {
  result: CapitalPlannerResult;
  onCreateSession: (r: CapitalSessionRecommendation) => void;
}): ReactNode {
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Khuyến nghị</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryStat label="Vốn" value={`${formatAmount(result.totalBankroll)} đ`} />
          <SummaryStat
            label="Khả dụng"
            value={`${formatAmount(result.usableBankroll)} đ`}
          />
          <SummaryStat label="Dự phòng" value={`${formatAmount(result.reserve)} đ`} />
        </div>

        <div className="border-t border-border pt-3">
          <p className="text-sm text-muted-foreground">
            {result.recommendations.length > 1
              ? `${String(result.recommendations.length)} session`
              : '1 session'}
            {' · '}
            Tổng lợi nhuận mục tiêu{' '}
            <strong className="text-foreground">
              {formatAmount(result.totalTargetProfit)} đ
            </strong>
          </p>
        </div>

        <div className="space-y-3">
          {result.recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              onCreateSession={() => onCreateSession(rec)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function RecommendationCard({
  rec,
  onCreateSession,
}: {
  rec: CapitalSessionRecommendation;
  onCreateSession: () => void;
}): ReactNode {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{rec.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Phân bổ {formatAmount(rec.allocatedCapital)} đ
          </p>
        </div>
        <Badge
          variant={rec.safety === 'safe' ? 'default' : rec.safety === 'tight' ? 'secondary' : 'outline'}
        >
          {SAFETY_LABELS[rec.safety]}
        </Badge>
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Lợi nhuận</p>
          <p className="font-medium">{formatAmount(rec.targetProfit)} đ</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Vòng</p>
          <p className="font-medium">{rec.roundCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Vốn cần</p>
          <p className="font-medium">{formatAmount(rec.requiredBankroll)} đ</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Max bet</p>
          <p className="font-medium">{formatAmount(rec.maxBet)} đ</p>
        </div>
      </div>
      <Button className="mt-4 w-full sm:w-auto" size="sm" onClick={onCreateSession}>
        Generate Session
      </Button>
    </div>
  );
}
