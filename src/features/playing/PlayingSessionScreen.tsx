import { AnimatePresence, motion } from 'framer-motion';
import { Check, PartyPopper, RotateCcw, Sparkles, Table2, Trophy } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ContinuePolicyConfig } from '@/features/game-designer/game-policy-types';
import { continueTargetsForPlan } from '@/features/continue/continue-policy-utils';
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
  readonly focusRoundIndex?: number | null;
  readonly onFocusRoundHandled?: () => void;
  readonly onPlaceBet: (roundIndex: number) => void;
  readonly onSetBetProgress: (targetRound: number) => void;
  readonly onUndoBet: () => void;
  readonly onWin: (roundIndex: number) => void;
  readonly onContinue: (targetRoundCount: number) => void;
  readonly onResetProgress: () => void;
  readonly onEdit: () => void;
  readonly onImprove?: () => void;
  readonly hideContinue?: boolean;
  readonly continuePolicy?: ContinuePolicyConfig;
}

export function PlayingSessionScreen({
  sessionTitle,
  generated,
  sessionNumber,
  completedThroughRound,
  timeline,
  sessionStatus,
  focusRoundIndex = null,
  onFocusRoundHandled,
  onPlaceBet,
  onSetBetProgress,
  onUndoBet,
  onWin,
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
  const [betPulse, setBetPulse] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const accumulated = accumulatedAtRound(strategy.rounds, completedThroughRound);
  const currentRoundIndex = completedThroughRound + 1;
  const currentRound = strategy.rounds[currentRoundIndex - 1];
  const currentBet = currentRound?.betAmount ?? 0;
  const nextBet = strategy.rounds[currentRoundIndex]?.betAmount ?? 0;
  const allRoundsDone = completedThroughRound >= totalRounds && sessionStatus === 'playing';
  const presetTargets = continueTargetsForPlan(continuePolicy, totalRounds);
  const progressPct =
    totalRounds > 0 ? Math.round((completedThroughRound / totalRounds) * 100) : 0;

  const focusRounds = useMemo(() => {
    const start = Math.max(1, completedThroughRound);
    const end = Math.min(totalRounds, completedThroughRound + 3);
    const indices: number[] = [];
    for (let i = start; i <= end; i++) {
      indices.push(i);
    }
    return indices.map((index) => {
      const round = strategy.rounds[index - 1];
      return {
        index,
        betAmount: round?.betAmount ?? 0,
        isCurrent: index === currentRoundIndex,
        isDone: index <= completedThroughRound,
      };
    });
  }, [strategy.rounds, completedThroughRound, totalRounds, currentRoundIndex]);

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

  useEffect(() => {
    if (sessionStatus !== 'playing' || currentRound === undefined) {
      return;
    }
    function onKeyDown(e: KeyboardEvent): void {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        return;
      }
      if (e.key === 'Enter' || e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        onPlaceBet(currentRoundIndex);
        setBetPulse(true);
        setTimeout(() => setBetPulse(false), 300);
      }
      if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        onWin(currentRoundIndex);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        onUndoBet();
      }
      if (e.key === 'z' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onUndoBet();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sessionStatus, currentRound, currentRoundIndex, onPlaceBet, onWin, onUndoBet]);

  if (viewMode === 'table') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode('focus')}>
            Chế độ tập trung
          </Button>
        </div>
        <PlanTableScreen
          generated={generated}
          sessionNumber={sessionNumber}
          completedThroughRound={completedThroughRound}
          onToggleRound={(roundIndex, checked) => {
            if (sessionStatus !== 'playing') {
              return;
            }
            onSetBetProgress(checked ? roundIndex : roundIndex - 1);
          }}
          onJumpToRound={onSetBetProgress}
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
    <div className="w-full max-w-lg space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {sessionTitle ?? `Phiên #${String(sessionNumber)}`}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {completedThroughRound} / {totalRounds} · {progressPct}%
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sessionStatus === 'playing' && completedThroughRound > 0 ? (
            <Button variant="outline" size="sm" onClick={onUndoBet} title="Phím Z">
              <RotateCcw className="h-4 w-4" />
              Hoàn tác
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => setViewMode('table')}>
            <Table2 className="h-4 w-4" />
            Bảng
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
          </CardContent>
        </Card>
      ) : null}

      {sessionStatus === 'playing' && currentRound !== undefined ? (
        <>
          <motion.div
            ref={heroRef}
            animate={betPulse ? { scale: [1, 1.02, 1] } : { scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-primary shadow-xl ring-2 ring-primary/25">
              <CardContent className="space-y-6 p-8 text-center sm:p-10">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Vòng
                  </p>
                  <p className="mt-1 text-5xl font-bold tabular-nums tracking-tight">
                    {currentRoundIndex}
                  </p>
                </div>
                <div className="border-t border-border pt-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Cược
                  </p>
                  <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-primary sm:text-5xl">
                    {formatAmount(currentBet)} đ
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Button size="lg" className="min-h-12 min-w-[140px] text-base" onClick={() => onPlaceBet(currentRoundIndex)}>
                    <Check className="h-5 w-5" />
                    Đã cược
                  </Button>
                  <Button size="lg" variant="outline" className="min-h-12 min-w-[140px] text-base" onClick={() => onWin(currentRoundIndex)}>
                    <Trophy className="h-5 w-5" />
                    Thắng
                  </Button>
                </div>
                {nextBet > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Tiếp theo: <strong className="text-foreground">{formatAmount(nextBet)} đ</strong>
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Enter / B · cược · W · thắng · Z · hoàn tác
                </p>
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

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {focusRounds.slice(1).map((round) => (
                <motion.div
                  key={round.index}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: round.isDone ? 0.4 : 0.85, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-lg border px-3 py-2 text-sm',
                      round.isDone && 'bg-muted/30',
                    )}
                  >
                    <span className="text-muted-foreground">Vòng {round.index}</span>
                    <span className="font-mono tabular-nums">{formatAmount(round.betAmount)} đ</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      ) : null}

      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Timeline</p>
          <SessionTimeline events={timeline} compact variant="horizontal" onNavigate={undefined} />
        </CardContent>
      </Card>

      {allRoundsDone && !hideContinue ? (
        <Card className="border-dashed">
          <CardContent className="space-y-4 p-5">
            <p className="font-medium">
              Bạn đã hoàn thành {totalRounds} vòng — chưa thắng.
            </p>
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
                      selectedContinue === n ? 'bg-primary-foreground border-primary-foreground' : 'border-muted-foreground',
                    )}
                  />
                  {n}
                </Button>
              ))}
              <Button
                variant={selectedContinue === -1 ? 'default' : 'outline'}
                size="sm"
                type="button"
                onClick={() => setSelectedContinue(-1)}
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
                onChange={(e) => setContinueTarget(e.target.value)}
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
