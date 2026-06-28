import {
  Download,
  LineChart,
  Play,
  Sparkles,
  Square,
} from 'lucide-react';
import { useRef, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { accumulatedAtRound } from '@/features/planner/plan-display';
import type { Plan, Session, SessionStatistics } from '@/features/session/session-domain';
import {
  formatSessionTime,
  getCurrentPlan,
  isPlanExhausted,
  planOriginLabel,
  planStatusBadge,
  sessionPresetName,
} from '@/features/session/session-domain';
import {
  computeSessionHealth,
  HEALTH_EMOJI,
  HEALTH_LABELS,
} from '@/features/session/session-health';
import { SessionNotesPanel } from '@/features/session/SessionNotesPanel';
import { SessionStatisticsPanel } from '@/features/session/SessionStatisticsPanel';
import {
  SessionTimeline,
  type TimelineNavigateTarget,
} from '@/features/session/SessionTimeline';
import { formatAmount } from '@/lib/money-format';
import { cn } from '@/lib/utils';

interface SessionCockpitProps {
  readonly session: Session;
  readonly preset: GamePolicyPreset | undefined;
  readonly stats: SessionStatistics;
  readonly readOnly?: boolean;
  readonly onStartPlaying: () => void;
  readonly onNavigateToRound: (roundIndex: number) => void;
  readonly onImprove: () => void;
  readonly onSimulate: () => void;
  readonly onExport: () => void;
  readonly onStopSession: () => void;
  readonly onNotesChange: (notes: string) => void;
}

function sessionStatusLabel(status: Session['status']): string {
  switch (status) {
    case 'draft':
      return 'Sẵn sàng';
    case 'playing':
      return 'Đang chơi';
    case 'won':
      return 'Thắng';
    case 'lost':
      return 'Thua';
    case 'stopped':
      return 'Dừng';
    default:
      return status;
  }
}

function betContext(plan: Plan): {
  currentBet: number;
  nextBet: number;
  spent: number;
  target: number;
  progressPct: number;
  totalRounds: number;
} {
  const rounds = plan.generated.strategy.rounds;
  const totalRounds = rounds.length;
  const done = plan.completedThroughRound;
  const currentBet = rounds[done]?.betAmount ?? 0;
  const nextBet = rounds[done + 1]?.betAmount ?? 0;
  return {
    currentBet,
    nextBet,
    spent: accumulatedAtRound(rounds, done),
    target: plan.generated.statistics.expectedProfitAmount,
    progressPct: totalRounds > 0 ? Math.round((done / totalRounds) * 100) : 0,
    totalRounds,
  };
}

export function SessionCockpit({
  session,
  preset,
  stats,
  readOnly = false,
  onStartPlaying,
  onNavigateToRound,
  onImprove,
  onSimulate,
  onExport,
  onStopSession,
  onNotesChange,
}: SessionCockpitProps): ReactNode {
  const planRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const currentPlan = getCurrentPlan(session);
  const currentExhausted = currentPlan !== null && isPlanExhausted(currentPlan);
  const canPlay =
    currentPlan !== null &&
    (currentPlan.status === 'ready' ||
      (currentPlan.status === 'playing' && !currentExhausted));

  const ctx =
    currentPlan !== null
      ? betContext(currentPlan)
      : {
          currentBet: 0,
          nextBet: 0,
          spent: 0,
          target: 0,
          progressPct: 0,
          totalRounds: 0,
        };

  const health = currentPlan !== null ? computeSessionHealth(currentPlan) : null;
  const barFilled = Math.max(0, Math.min(10, Math.round(ctx.progressPct / 10)));

  function handleTimelineNavigate(target: TimelineNavigateTarget): void {
    if (target.kind === 'plan') {
      const el = planRefs.current[target.planId];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.classList.add('ring-2', 'ring-primary/40');
      setTimeout(() => el?.classList.remove('ring-2', 'ring-primary/40'), 1200);
      return;
    }
    onNavigateToRound(target.roundIndex);
  }

  return (
    <div className="w-full space-y-5">
      <Card className="border-primary/15 shadow-sm">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{session.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {sessionPresetName(preset)}
                {session.startedAt !== null ? ` · ${formatSessionTime(session.startedAt)}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {health !== null ? (
                <Badge variant="outline" className="gap-1 text-xs">
                  <span>{HEALTH_EMOJI[health]}</span>
                  {HEALTH_LABELS[health]}
                </Badge>
              ) : null}
              <Badge
                variant={session.status === 'playing' ? 'default' : 'outline'}
                className="text-xs"
              >
                {sessionStatusLabel(session.status)}
              </Badge>
              {session.status === 'playing' && !readOnly ? (
                <Button variant="outline" size="sm" onClick={onStopSession}>
                  <Square className="h-3.5 w-3.5" />
                  Kết thúc
                </Button>
              ) : null}
            </div>
          </div>

          {currentPlan !== null && session.status === 'playing' ? (
            <>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Plan {currentPlan.label} · {planOriginLabel(currentPlan.origin)}
                  </span>
                  <span>
                    {currentPlan.completedThroughRound} / {ctx.totalRounds} · {ctx.progressPct}%
                  </span>
                </div>
                <p className="mt-2 font-mono text-sm tracking-[0.2em] text-primary">
                  {'█'.repeat(barFilled)}
                  {'░'.repeat(10 - barFilled)}
                </p>
              </div>

              <div className="space-y-4 border-t border-border pt-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Lượt hiện tại
                  </p>
                  <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-primary">
                    {formatAmount(ctx.currentBet)} đ
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric
                    label="Tiếp theo"
                    value={ctx.nextBet > 0 ? `${formatAmount(ctx.nextBet)} đ` : '—'}
                  />
                  <Metric label="Đã chi" value={`${formatAmount(ctx.spent)} đ`} />
                  <Metric label="Mục tiêu" value={`${formatAmount(ctx.target)} đ`} />
                </div>
              </div>
            </>
          ) : currentPlan !== null ? (
            <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
              <Metric
                label="Plan hiện tại"
                value={`${currentPlan.label} · ${planOriginLabel(currentPlan.origin)}`}
                large={false}
              />
              <Metric label="Mục tiêu" value={`${formatAmount(ctx.target)} đ`} />
              <Metric label="Vòng" value={String(ctx.totalRounds)} />
              <Metric
                label="Vốn cần"
                value={`${formatAmount(currentPlan.generated.statistics.requiredBankrollAmount)} đ`}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {!readOnly && canPlay ? (
              <Button onClick={onStartPlaying} size="lg">
                <Play className="h-4 w-4" />
                {currentPlan?.status === 'ready' ? 'Bắt đầu chơi' : 'Tiếp tục'}
              </Button>
            ) : null}
            {currentPlan !== null && session.status !== 'won' && !readOnly ? (
              <>
                <Button variant="outline" onClick={onImprove}>
                  <Sparkles className="h-4 w-4" />
                  Cải thiện
                </Button>
                <Button variant="outline" onClick={onSimulate}>
                  <LineChart className="h-4 w-4" />
                  Mô phỏng
                </Button>
              </>
            ) : null}
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4" />
              Xuất
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentExhausted && currentPlan?.status === 'playing' ? (
        <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 text-sm">
            <p className="font-medium">{currentPlan.label} — hết vòng, chưa thắng.</p>
            <p className="mt-1 text-muted-foreground">
              Continue hoặc Cải thiện để tạo plan tiếp theo.
            </p>
            <Button className="mt-3" size="sm" onClick={onStartPlaying}>
              Tiếp tục chơi
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="mb-1 text-sm font-semibold">Timeline</p>
            <p className="mb-3 text-[10px] text-muted-foreground">Bấm để nhảy tới plan hoặc vòng</p>
            <SessionTimeline
              events={session.timeline}
              variant="vertical"
              maxItems={12}
              onNavigate={handleTimelineNavigate}
            />
          </CardContent>
        </Card>
        <SessionStatisticsPanel stats={stats} currentPlan={currentPlan} />
      </div>

      <SessionNotesPanel
        notes={session.notes}
        readOnly={readOnly}
        onNotesChange={onNotesChange}
      />

      <Card>
        <CardContent className="divide-y divide-border p-0">
          <p className="px-4 py-3 text-sm font-semibold">Plans</p>
          {session.plans.map((plan) => {
            const isCurrent = plan.id === session.currentPlanId;
            const badge = planStatusBadge(plan, isCurrent);
            return (
              <div
                key={plan.id}
                ref={(el) => {
                  planRefs.current[plan.id] = el;
                }}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm transition-shadow',
                  isCurrent && 'bg-primary/5',
                )}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{plan.label}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {planOriginLabel(plan.origin)}
                    </Badge>
                    <Badge variant={badge.variant} className="text-[10px]">
                      {badge.text}
                    </Badge>
                  </div>
                  {isCurrent && currentPlan !== null ? (
                    <p className="text-xs text-muted-foreground">
                      {currentPlan.completedThroughRound} /{' '}
                      {currentPlan.generated.strategy.rounds.length} vòng
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  large = true,
}: {
  label: string;
  value: string;
  large?: boolean;
}): ReactNode {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('font-semibold tabular-nums', large ? 'text-base' : 'text-sm')}>{value}</p>
    </div>
  );
}
