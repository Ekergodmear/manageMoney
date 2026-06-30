import { Landmark, Play, Plus, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { CapitalOverview } from '@/features/capital/capital-planner-types';
import { CAPITAL_GOAL_LABELS } from '@/features/capital/capital-planner-types';
import { GameStatisticsWidgets } from '@/features/dashboard/GameStatisticsWidgets';
import { RecentActivityWidget } from '@/features/dashboard/RecentActivityWidget';
import type { AppNotification } from '@/features/notifications/notification-types';
import type { GameStatisticsSnapshot } from '@/features/game-data/statistics/statistics-types';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { marketLabelFromPreset } from '@/features/game-data/markets/market-catalog';
import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';
import { accumulatedAtRound } from '@/features/planner/plan-display';
import type { RecommendationSet } from '@/features/recommendation/recommendation-set-types';
import type { Session } from '@/features/session/session-domain';
import { getCurrentPlan } from '@/features/session/session-domain';
import { formatAmount } from '@/lib/money-format';

interface DashboardScreenProps {
  readonly userName?: string;
  readonly activeSession: Session | null;
  readonly preset: GamePolicyPreset | undefined;
  readonly presets: readonly GamePolicyPreset[];
  readonly recommendationSet: RecommendationSet | null;
  readonly gameStatistics: GameStatisticsSnapshot | null;
  readonly gameStatisticsLoading?: boolean;
  readonly gameStatisticsError?: string | null;
  readonly notifications: readonly AppNotification[];
  readonly onOpenNotifications?: () => void;
  readonly latestDraw: CollectorDrawResult | null;
  readonly capitalOverview: CapitalOverview;
  readonly onOpenSession: () => void;
  readonly onNewSession: () => void;
  readonly onOpenCapitalPlanner: () => void;
}

function CapitalSummary({
  overview,
  onOpenCapitalPlanner,
}: {
  overview: CapitalOverview;
  onOpenCapitalPlanner: () => void;
}): ReactNode {
  if (overview.total <= 0) {
    return null;
  }

  return (
    <Card className="border-primary/15">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Vốn</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Tổng</p>
            <p className="font-semibold">{formatAmount(overview.total)} đ</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Đã phân bổ</p>
            <p className="font-semibold">{formatAmount(overview.allocated)} đ</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Khả dụng</p>
            <p className="font-semibold">{formatAmount(overview.available)} đ</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onOpenCapitalPlanner}>
          Mở Capital Planner
        </Button>
      </CardContent>
    </Card>
  );
}

function CapitalRecommendationCard({
  set,
  presets,
  onOpenCapitalPlanner,
}: {
  set: RecommendationSet;
  presets: readonly GamePolicyPreset[];
  onOpenCapitalPlanner: () => void;
}): ReactNode {
  if (set.source !== 'capital' || set.recommendations.length === 0) {
    return null;
  }

  const preset = presets.find((p) => p.id === set.presetId);
  const rec =
    set.recommendations.find((r) => r.recommendationId === set.selectedRecommendationId) ??
    set.recommendations[0];
  if (rec === undefined) {
    return null;
  }

  const marketLabel =
    preset !== undefined ? marketLabelFromPreset(preset, rec.marketId) : rec.marketId;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Khuyến nghị Capital</p>
        </div>
        <p className="text-sm">
          <strong className="text-foreground">{CAPITAL_GOAL_LABELS[set.strategy]}</strong>
          {' · '}
          <strong className="text-primary">{marketLabel}</strong>
          {' · '}
          {formatAmount(rec.requiredBankroll)} đ{' · '}
          {rec.roundCount} kỳ
        </p>
        <Button variant="outline" size="sm" onClick={onOpenCapitalPlanner}>
          Mở Capital Planner
        </Button>
      </CardContent>
    </Card>
  );
}

export function DashboardScreen({
  userName = 'bạn',
  activeSession,
  preset,
  presets,
  recommendationSet,
  gameStatistics,
  gameStatisticsLoading = false,
  gameStatisticsError = null,
  notifications,
  onOpenNotifications,
  latestDraw,
  capitalOverview,
  onOpenSession,
  onNewSession,
  onOpenCapitalPlanner,
}: DashboardScreenProps): ReactNode {
  const currentPlan = activeSession !== null ? getCurrentPlan(activeSession) : null;
  const hasActive =
    activeSession !== null &&
    (activeSession.status === 'playing' || activeSession.status === 'draft');

  if (!hasActive || currentPlan === null) {
    return (
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Xin chào {userName}</h2>
        </div>
        <CapitalSummary overview={capitalOverview} onOpenCapitalPlanner={onOpenCapitalPlanner} />
        {recommendationSet !== null ? (
          <CapitalRecommendationCard
            set={recommendationSet}
            presets={presets}
            onOpenCapitalPlanner={onOpenCapitalPlanner}
          />
        ) : null}
        <GameStatisticsWidgets
          snapshot={gameStatistics}
          loading={gameStatisticsLoading}
          error={gameStatisticsError}
        />
        <RecentActivityWidget
          notifications={notifications}
          {...(onOpenNotifications !== undefined ? { onOpenNotifications } : {})}
        />
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-muted-foreground">Bạn chưa có session nào.</p>
            <Button onClick={onNewSession} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Chiến lược mới (Capital Planner)
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRounds = currentPlan.generated.strategy.rounds.length;
  const completedThroughRound = currentPlan.completedThroughRound;
  const accumulated = accumulatedAtRound(
    currentPlan.generated.strategy.rounds,
    completedThroughRound,
  );
  const progressPct = totalRounds > 0 ? Math.round((completedThroughRound / totalRounds) * 100) : 0;
  const nextRound = currentPlan.generated.strategy.rounds[completedThroughRound];
  const nextBet = nextRound?.betAmount ?? 0;
  const barFilled = Math.max(1, Math.round(progressPct / 10));
  const lastPlayed = activeSession.playedRounds[activeSession.playedRounds.length - 1];
  const liveStatus =
    activeSession.status === 'playing'
      ? lastPlayed === undefined
        ? 'Chờ kỳ'
        : lastPlayed.round === completedThroughRound
          ? lastPlayed.won
            ? 'Trúng'
            : 'Thua'
          : 'Chờ kỳ'
      : '—';

  if (activeSession.status === 'draft' && currentPlan.status === 'ready') {
    return (
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Xin chào {userName}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Session sẵn sàng — mở Session để bắt đầu.
          </p>
        </div>
        <CapitalSummary overview={capitalOverview} onOpenCapitalPlanner={onOpenCapitalPlanner} />
        {recommendationSet !== null ? (
          <CapitalRecommendationCard
            set={recommendationSet}
            presets={presets}
            onOpenCapitalPlanner={onOpenCapitalPlanner}
          />
        ) : null}
        <GameStatisticsWidgets
          snapshot={gameStatistics}
          loading={gameStatisticsLoading}
          error={gameStatisticsError}
        />
        <Card className="border-primary/20 shadow-md">
          <CardContent className="space-y-4 p-6">
            <p className="font-medium">
              {activeSession.title}
              {preset !== undefined
                ? ` · ${marketLabelFromPreset(preset, currentPlan.marketId)}`
                : ''}{' '}
              · {totalRounds} kỳ
            </p>
            <Button onClick={onOpenSession} className="w-full">
              <Play className="h-4 w-4" />
              Mở Session
            </Button>
            <Button variant="outline" onClick={onNewSession} className="w-full">
              Capital Planner
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Xin chào {userName}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <strong className="text-foreground">{activeSession.title}</strong> đang chơi.
        </p>
      </div>

      <CapitalSummary overview={capitalOverview} onOpenCapitalPlanner={onOpenCapitalPlanner} />
      {recommendationSet !== null ? (
        <CapitalRecommendationCard
          set={recommendationSet}
          presets={presets}
          onOpenCapitalPlanner={onOpenCapitalPlanner}
        />
      ) : null}

      <GameStatisticsWidgets
        snapshot={gameStatistics}
        loading={gameStatisticsLoading}
        error={gameStatisticsError}
      />
      <RecentActivityWidget
        notifications={notifications}
        {...(onOpenNotifications !== undefined ? { onOpenNotifications } : {})}
      />

      <Card className="border-primary/20 shadow-md">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Active Session
              </p>
              <p className="mt-1 text-lg font-semibold">
                {activeSession.title}
                {preset !== undefined
                  ? ` · ${marketLabelFromPreset(preset, currentPlan.marketId)}`
                  : ''}
              </p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
              {liveStatus}
            </span>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">{currentPlan.label}</p>
            <p className="mt-1 text-lg font-semibold">
              {completedThroughRound} / {totalRounds}
            </p>
            <p className="mt-2 font-mono text-sm tracking-widest text-primary">
              {'█'.repeat(barFilled)}
              {'░'.repeat(10 - barFilled)} {progressPct}%
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Tiền đã chi</p>
            <p className="text-xl font-bold">{formatAmount(accumulated)} đ</p>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Kỳ gần nhất</p>
            <p className="font-mono text-sm font-semibold">
              {latestDraw?.drawKey ?? lastPlayed?.drawKey ?? '—'}
            </p>
            {latestDraw !== null ? (
              <p className="text-xs text-muted-foreground">
                {latestDraw.dice.join('-')} · Tổng {latestDraw.total}
              </p>
            ) : null}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Lần cược tiếp</p>
            <p className="text-xl font-bold">{nextBet > 0 ? `${formatAmount(nextBet)} đ` : '—'}</p>
          </div>

          <Button onClick={onOpenSession} className="w-full" size="lg">
            <Play className="h-4 w-4" />
            Mở Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
