import { Landmark, Sparkles } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  CapitalGoal,
  CapitalPlannerInput,
  RiskProfile,
} from '@/features/capital/capital-planner-types';
import { CAPITAL_GOAL_LABELS, RISK_LABELS } from '@/features/capital/capital-planner-types';
import { PresetPicker } from '@/features/game-designer/PresetPicker';
import { PlanMarketPicker } from '@/features/planner/plan-market-picker';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { applyMarketToForm, applyPresetToForm } from '@/features/game-designer/preset-utils';
import {
  marketLabelFromPreset,
  resolvePresetMarkets,
} from '@/features/game-data/markets/market-catalog';
import { DEFAULT_MARKET_ID } from '@/features/game-data/markets/market-definition';
import { findMarketById } from '@/features/game-data/markets/market-resolver';
import { formatExpectedReturn, formatHouseEdge } from '@/features/game-data/markets/market-metrics';
import type {
  RecommendationSet,
  StrategyRecommendation,
} from '@/features/recommendation/recommendation-set-types';
import { DEFAULT_PLANNER_FORM } from '@/features/planner/plan-service';
import { formatMoneyFieldValue } from '@/features/planner/schema';
import { formatAmount, parseMoneyPositiveInt } from '@/lib/money-format';
import { formatPercent } from '@/features/planner/plan-display';
import { WorkspacePage } from '@/layout/WorkspacePage';
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
  readonly initialMarketId?: string | undefined;
  readonly recommendationSet: RecommendationSet | null;
  readonly onPresetSelect: (preset: GamePolicyPreset) => void;
  readonly onGenerate: (input: CapitalPlannerInput) => Promise<RecommendationSet | null>;
  readonly onUseRecommendation: (recommendationId: string) => void;
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
              value === option ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40',
            )}
          >
            <input
              type="radio"
              name={label}
              checked={value === option}
              onChange={() => {
                onChange(option);
              }}
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
  initialMarketId,
  recommendationSet,
  onPresetSelect,
  onGenerate,
  onUseRecommendation,
}: CapitalPlannerScreenProps): ReactNode {
  const [bankrollInput, setBankrollInput] = useState(initialBankroll);
  const [strategy, setStrategy] = useState<CapitalGoal>(initialStrategy);
  const [risk, setRisk] = useState<RiskProfile>(initialRisk);
  const [marketId, setMarketId] = useState(
    initialMarketId ?? recommendationSet?.marketId ?? DEFAULT_MARKET_ID,
  );
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setBankrollInput(initialBankroll);
    setStrategy(initialStrategy);
    setRisk(initialRisk);
    if (initialMarketId !== undefined) {
      setMarketId(initialMarketId);
    }
  }, [initialBankroll, initialStrategy, initialRisk, initialMarketId]);

  useEffect(() => {
    if (recommendationSet?.marketId !== undefined) {
      setMarketId(recommendationSet.marketId);
    }
  }, [recommendationSet?.setId, recommendationSet?.marketId]);

  const activePreset = presets.find((p) => p.id === activePresetId);

  useEffect(() => {
    if (activePreset === undefined) {
      return;
    }
    const markets = resolvePresetMarkets(activePreset);
    if (!markets.some((m) => m.id === marketId)) {
      setMarketId(DEFAULT_MARKET_ID);
    }
  }, [activePresetId, activePreset, marketId]);

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

    setGenerating(true);
    setError(null);

    void (async () => {
      try {
        const baseForm = applyMarketToForm(
          applyPresetToForm({ ...DEFAULT_PLANNER_FORM, userBankroll: bankrollInput }, activePreset),
          activePreset,
          marketId,
        );
        const set = await onGenerate({
          bankroll,
          presetId: activePresetId,
          baseForm,
          strategy,
          risk,
        });
        if (set === null) {
          setError('Không tìm được chiến lược khả thi với vốn và game này.');
        }
      } finally {
        setGenerating(false);
      }
    })();
  }

  return (
    <WorkspacePage width="wide">
      <div>
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Capital Planner</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Với số vốn hôm nay, engine đề xuất chiến lược chơi — không cần nhập lợi nhuận hay số vòng.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
              onChange={(e) => {
                setBankrollInput(formatMoneyFieldValue('userBankroll', e.target.value));
              }}
              placeholder="30.000.000"
            />
          </div>
          <PresetPicker
            presets={presets}
            activePresetId={activePresetId}
            onSelect={onPresetSelect}
          />
          {activePreset !== undefined ? (
            <PlanMarketPicker preset={activePreset} value={marketId} onChange={setMarketId} />
          ) : null}
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
          <Button className="w-full" size="lg" onClick={handleGenerate} disabled={generating}>
            <Sparkles className="h-4 w-4" />
            {generating ? 'Đang tính…' : 'Generate Strategy'}
          </Button>
          {error !== null ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
      </div>

      {recommendationSet !== null ? (
        <RecommendationSetPanel
          set={recommendationSet}
          presets={presets}
          onUseRecommendation={onUseRecommendation}
        />
      ) : null}
    </WorkspacePage>
  );
}

function RecommendationSetPanel({
  set,
  presets,
  onUseRecommendation,
}: {
  set: RecommendationSet;
  presets: readonly GamePolicyPreset[];
  onUseRecommendation: (recommendationId: string) => void;
}): ReactNode {
  const preset = presets.find((p) => p.id === set.presetId);
  const market =
    preset !== undefined ? findMarketById(resolvePresetMarkets(preset), set.marketId) : undefined;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Khuyến nghị</CardTitle>
        {market !== undefined ? (
          <p className="text-sm text-muted-foreground">
            {CAPITAL_GOAL_LABELS[set.strategy]} ·{' '}
            <strong className="text-foreground">{market.label}</strong> · ×{market.multiplier} ·{' '}
            {formatAmount(set.recommendations[0]?.requiredBankroll ?? 0)} đ ·{' '}
            {set.recommendations[0]?.roundCount ?? 0} kỳ
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryStat label="Vốn" value={`${formatAmount(set.totalBankroll)} đ`} />
          <SummaryStat label="Khả dụng" value={`${formatAmount(set.usableBankroll)} đ`} />
          <SummaryStat label="Dự phòng" value={`${formatAmount(set.reserve)} đ`} />
        </div>

        <div className="border-t border-border pt-3">
          <p className="text-sm text-muted-foreground">
            {set.recommendations.length > 1
              ? `${String(set.recommendations.length)} session`
              : '1 session'}
            {' · '}
            Tổng lợi nhuận mục tiêu{' '}
            <strong className="text-foreground">{formatAmount(set.totalTargetProfit)} đ</strong>
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {set.recommendations.map((rec) => (
            <RecommendationCard
              key={rec.recommendationId}
              rec={rec}
              preset={preset}
              onUse={() => {
                onUseRecommendation(rec.recommendationId);
              }}
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
  preset,
  onUse,
}: {
  rec: StrategyRecommendation;
  preset: GamePolicyPreset | undefined;
  onUse: () => void;
}): ReactNode {
  const market =
    preset !== undefined ? findMarketById(resolvePresetMarkets(preset), rec.marketId) : undefined;

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{rec.label}</p>
          {market !== undefined ? (
            <p className="mt-1 text-sm font-medium text-primary">
              {market.label} · ×{market.multiplier}
            </p>
          ) : preset !== undefined ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {marketLabelFromPreset(preset, rec.marketId)}
            </p>
          ) : null}
          <p className="mt-0.5 text-sm text-muted-foreground">
            Phân bổ {formatAmount(rec.allocatedCapital)} đ
          </p>
        </div>
        <Badge
          variant={
            rec.safety === 'safe' ? 'default' : rec.safety === 'tight' ? 'secondary' : 'outline'
          }
        >
          {SAFETY_LABELS[rec.safety]}
        </Badge>
      </div>
      {market !== undefined ? (
        <p className="mt-2 text-xs text-muted-foreground">
          P {formatPercent(market.probability * 100)}% · EV{' '}
          {formatExpectedReturn(market.expectedReturn)} · Edge {formatHouseEdge(market.houseEdge)}
        </p>
      ) : null}
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
      <Button className="mt-4 w-full sm:w-auto" size="sm" onClick={onUse}>
        Dùng phương án này
      </Button>
    </div>
  );
}
