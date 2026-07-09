import { motion } from 'framer-motion';
import { CheckCircle2, Clock, PartyPopper, Sparkles, Table2, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ContinuePolicyConfig } from '@/features/game-designer/game-policy-types';
import { continueTargetsForPlan } from '@/features/continue/continue-policy-utils';
import type { PlayedRound } from '@/features/game-data/entities/played-round';
import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';
import { accumulatedAtRound } from '@/features/planner/plan-display';
import type { GenerateResult } from '@/features/planner/plan-service';
import { PlanTableScreen } from '@/features/planner/PlanTableScreen';
import { SessionTimeline } from '@/features/session/SessionTimeline';
import type { SessionTimelineEvent } from '@/features/session/session-domain';
import { formatAmount } from '@/lib/money-format';
import { cn } from '@/lib/utils';

interface PlayingSessionScreenProps {
  readonly sessionTitle?: string;
  readonly generated: GenerateResult;
  readonly sessionNumber: number;
  readonly completedThroughRound: number;
  readonly timeline: readonly SessionTimelineEvent[];
  readonly sessionStatus: 'playing' | 'won' | 'lost';
  readonly betMarketLabel: string;
  readonly latestDraw: CollectorDrawResult | null;
  readonly playedRounds: readonly PlayedRound[];
  readonly autoSettlement?: boolean;
  readonly focusRoundIndex?: number | null;
  readonly onFocusRoundHandled?: () => void;
  readonly onContinue: (targetRoundCount: number) => void;
  readonly onResetProgress: () => void;
  readonly onEdit: () => void;
  readonly onImprove?: () => void;
  readonly hideContinue?: boolean;
  readonly continuePolicy?: ContinuePolicyConfig;
}

function lastPlayedRound(playedRounds: readonly PlayedRound[]): PlayedRound | null {
  if (playedRounds.length === 0) {
    return null;
  }
  return playedRounds[playedRounds.length - 1] ?? null;
}

export function PlayingSessionScreen({
  sessionTitle,
  generated,
  sessionNumber,
  completedThroughRound,
  timeline,
  sessionStatus,
  betMarketLabel,
  latestDraw,
  playedRounds,
  autoSettlement = true,
  focusRoundIndex = null,
  onFocusRoundHandled,
  onContinue,
  onResetProgress,
  onEdit,
  onImprove,
  hideContinue = false,
  continuePolicy = { maximumRounds: 5000, presets: [1000, 1500, 2000, 5000] },
}: PlayingSessionScreenProps): React.ReactNode {
  const { strategy, statistics } = generated;
  const totalRounds = strategy.rounds.length;
  const [viewMode, setViewMode] = useState<'focus' | 'table'>('focus');
  const [continueTarget, setContinueTarget] = useState<string>('');
  const [selectedContinue, setSelectedContinue] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const accumulated = accumulatedAtRound(strategy.rounds, completedThroughRound);
  const currentRoundIndex = completedThroughRound + 1;
  const currentRound = strategy.rounds[currentRoundIndex - 1];
  const currentBet = currentRound?.betAmount ?? 0;
  const nextBet = strategy.rounds[currentRoundIndex]?.betAmount ?? 0;
  const allRoundsDone = completedThroughRound >= totalRounds && sessionStatus === 'playing';
  const presetTargets = continueTargetsForPlan(continuePolicy, totalRounds);
  const progressPct = totalRounds > 0 ? Math.round((completedThroughRound / totalRounds) * 100) : 0;
  const lastRound = lastPlayedRound(playedRounds);

  const liveStatus = useMemo((): { label: string; tone: 'waiting' | 'win' | 'lose' } => {
    if (sessionStatus === 'won') {
      return { label: 'Thắng', tone: 'win' };
    }
    if (lastRound !== null && lastRound.round === completedThroughRound) {
      return lastRound.won ? { label: 'Trúng', tone: 'win' } : { label: 'Thua', tone: 'lose' };
    }
    return { label: 'Đang chờ kỳ…', tone: 'waiting' };
  }, [sessionStatus, lastRound, completedThroughRound]);

  useEffect(() => {
    if (focusRoundIndex !== null && focusRoundIndex > 0) {
      heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      onFocusRoundHandled?.();
    }
  }, [focusRoundIndex, onFocusRoundHandled]);

  useEffect(() => {
    if (sessionStatus !== 'playing' || viewMode !== 'focus') {
      return;
    }
    heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [completedThroughRound, viewMode, sessionStatus]);

  if (viewMode === 'table') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setViewMode('focus');
            }}
          >
            Chế độ tập trung
          </Button>
        </div>
        <PlanTableScreen
          generated={generated}
          sessionNumber={sessionNumber}
          completedThroughRound={completedThroughRound}
          playedRounds={playedRounds}
          autoSettlement={autoSettlement}
          onToggleRound={() => undefined}
          onJumpToRound={() => undefined}
          onResetProgress={onResetProgress}
          onEdit={onEdit}
          sessionStatus={sessionStatus}
          onContinue={onContinue}
          hideContinue
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {sessionTitle ?? `Phiên #${String(sessionNumber)}`}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {betMarketLabel} · {completedThroughRound} / {totalRounds} · {progressPct}%
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setViewMode('table');
            }}
          >
            <Table2 className="h-4 w-4" />
            Lịch sử vòng
          </Button>
          {onImprove !== undefined ? (
            <Button variant="outline" size="sm" onClick={onImprove}>
              <Sparkles className="h-4 w-4" />
              Cải thiện
            </Button>
          ) : null}
        </div>
      </div>

      {sessionStatus === 'won' ? (
        <Card className="border-success bg-success/10">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <PartyPopper className="h-10 w-10 text-success-foreground" />
            <p className="text-lg font-bold">Chúc mừng — bạn đã thắng!</p>
            {lastRound?.won === true ? (
              <p className="text-sm text-muted-foreground">
                +{formatAmount(lastRound.netPrize)} đ (lợi nhuận {formatAmount(lastRound.profit)} đ)
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {sessionStatus === 'playing' && currentRound !== undefined ? (
        <>
          <motion.div ref={heroRef} layout>
            <Card className="border-primary shadow-xl ring-2 ring-primary/25">
              <CardContent className="space-y-5 p-8 text-center sm:p-10">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Kỳ hiện tại
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold tabular-nums tracking-tight">
                      {latestDraw?.drawKey ?? '—'}
                    </p>
                    {latestDraw !== null ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {latestDraw.dice.join('-')} · Tổng {latestDraw.total}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">Chờ Collector…</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Vòng hiện tại
                    </p>
                    <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight">
                      {currentRoundIndex}
                      <span className="text-lg text-muted-foreground"> / {totalRounds}</span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Cược vòng này
                  </p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-primary">
                    {formatAmount(currentBet)} đ
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2 pt-2">
                  <StatusBadge status={liveStatus.tone} label={liveStatus.label} />
                  {autoSettlement ? (
                    <p className="text-xs text-muted-foreground">
                      Tự động khớp khi Collector có kỳ mới
                    </p>
                  ) : null}
                </div>

                {lastRound !== null ? (
                  <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm">
                    <p className="text-muted-foreground">Vòng {lastRound.round}</p>
                    <p className="font-medium">
                      {lastRound.won ? (
                        <span className="text-success-foreground">
                          Trúng · +{formatAmount(lastRound.netPrize)} đ
                        </span>
                      ) : (
                        <span>
                          Thua · Tổng {lastRound.dice.reduce((a, b) => a + b, 0)} (
                          {lastRound.dice.join('-')})
                        </span>
                      )}
                    </p>
                  </div>
                ) : null}

                {nextBet > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Tiếp theo:{' '}
                    <strong className="text-foreground">{formatAmount(nextBet)} đ</strong>
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${String(progressPct)}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Đã chi {formatAmount(accumulated)} đ
            </p>
          </div>
        </>
      ) : null}

      {playedRounds.length > 0 ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-xs font-medium text-muted-foreground">Vòng gần đây</p>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
              {[...playedRounds]
                .reverse()
                .slice(0, 8)
                .map((pr) => (
                  <li
                    key={pr.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
                  >
                    <span className="text-muted-foreground">#{pr.round}</span>
                    <span className="font-mono text-xs">{pr.drawKey.slice(-6)}</span>
                    <span>{pr.dice.join('-')}</span>
                    {pr.won ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success-foreground" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                    )}
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Timeline</p>
          <SessionTimeline events={timeline} compact variant="horizontal" />
        </CardContent>
      </Card>

      {allRoundsDone && !hideContinue ? (
        <Card className="border-dashed">
          <CardContent className="space-y-4 p-5">
            <p className="font-medium">Bạn đã hoàn thành {totalRounds} vòng — chưa thắng.</p>
            <p className="text-sm text-muted-foreground">Tiếp tục đến:</p>
            <div className="flex flex-wrap gap-2">
              {presetTargets.map((n) => (
                <Button
                  key={n}
                  variant={selectedContinue === n ? 'default' : 'outline'}
                  size="sm"
                  type="button"
                  className="gap-2"
                  onClick={() => {
                    setSelectedContinue(n);
                    setContinueTarget(String(n));
                  }}
                >
                  <span
                    className={cn(
                      'inline-block h-2 w-2 rounded-full border',
                      selectedContinue === n
                        ? 'bg-primary-foreground border-primary-foreground'
                        : 'border-muted-foreground',
                    )}
                  />
                  {n}
                </Button>
              ))}
              <Button
                variant={selectedContinue === -1 ? 'default' : 'outline'}
                size="sm"
                type="button"
                onClick={() => {
                  setSelectedContinue(-1);
                }}
              >
                Tùy chỉnh
              </Button>
            </div>
            {selectedContinue === -1 ? (
              <Input
                type="number"
                min={totalRounds + 1}
                max={continuePolicy.maximumRounds}
                placeholder={`Ví dụ: ${String(presetTargets[0] ?? totalRounds + 100)}`}
                value={continueTarget}
                onChange={(e) => {
                  setContinueTarget(e.target.value);
                }}
              />
            ) : null}
            <Button
              type="button"
              onClick={() => {
                const target =
                  selectedContinue === -1
                    ? Number(continueTarget)
                    : (selectedContinue ?? presetTargets[0] ?? totalRounds + 100);
                if (
                  Number.isFinite(target) &&
                  target > totalRounds &&
                  target <= continuePolicy.maximumRounds
                ) {
                  onContinue(target);
                }
              }}
            >
              Tiếp tục
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        Vốn cần {formatAmount(statistics.requiredBankrollAmount)} đ
      </p>
    </div>
  );
}

function StatusBadge({
  status,
  label,
}: {
  readonly status: 'waiting' | 'win' | 'lose';
  readonly label: string;
}): React.ReactNode {
  if (status === 'win') {
    return (
      <Badge className="gap-1.5 bg-success/15 text-success-foreground hover:bg-success/20">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {label}
      </Badge>
    );
  }
  if (status === 'lose') {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <XCircle className="h-3.5 w-3.5" />
        {label}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1.5">
      <Clock className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}
