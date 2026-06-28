import { AnimatePresence, motion } from 'framer-motion';
import { Check, PartyPopper, RotateCcw, Sparkles, Table2, Trophy } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { accumulatedAtRound } from '@/features/planner/plan-display';
import type { GenerateResult } from '@/features/planner/plan-service';
import { PlanTableScreen } from '@/features/planner/PlanTableScreen';
import { SessionTimeline } from '@/features/session/SessionTimeline';
import type { SessionTimelineEvent } from '@/features/session/session-types';
import { formatAmount } from '@/lib/money-format';
import { cn } from '@/lib/utils';

interface PlayingSessionScreenProps {
  readonly generated: GenerateResult;
  readonly sessionNumber: number;
  readonly completedThroughRound: number;
  readonly timeline: readonly SessionTimelineEvent[];
  readonly sessionStatus: 'playing' | 'won' | 'lost';
  readonly onPlaceBet: (roundIndex: number) => void;
  readonly onUndoBet: () => void;
  readonly onWin: (roundIndex: number) => void;
  readonly onContinue: (targetRoundCount: number) => void;
  readonly onResetProgress: () => void;
  readonly onEdit: () => void;
  readonly onImprove?: () => void;
}

function continuePresets(totalRounds: number): number[] {
  const candidates = [
    totalRounds + 100,
    totalRounds + 200,
    totalRounds + 500,
    1000,
    1500,
    2000,
    5000,
  ];
  return [...new Set(candidates.filter((n) => n > totalRounds))].sort((a, b) => a - b);
}

export function PlayingSessionScreen({
  generated,
  sessionNumber,
  completedThroughRound,
  timeline,
  sessionStatus,
  onPlaceBet,
  onUndoBet,
  onWin,
  onContinue,
  onResetProgress,
  onEdit,
  onImprove,
}: PlayingSessionScreenProps): React.ReactNode {
  const { strategy, statistics } = generated;
  const totalRounds = strategy.rounds.length;
  const [viewMode, setViewMode] = useState<'focus' | 'table'>('focus');
  const [continueTarget, setContinueTarget] = useState<string>('');
  const [selectedContinue, setSelectedContinue] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const accumulated = accumulatedAtRound(strategy.rounds, completedThroughRound);
  const currentRoundIndex = completedThroughRound + 1;
  const currentRound = strategy.rounds[currentRoundIndex - 1];
  const nextBet =
    completedThroughRound > 0
      ? (strategy.rounds[completedThroughRound - 1]?.betAmount ?? 0)
      : 0;
  const allRoundsDone = completedThroughRound >= totalRounds && sessionStatus === 'playing';
  const presetTargets = continuePresets(totalRounds);
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
    if (viewMode !== 'focus') {
      return;
    }
    listRef.current?.querySelector('[data-current="true"]')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [completedThroughRound, viewMode]);

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
            if (checked) {
              onPlaceBet(roundIndex);
            } else if (roundIndex === completedThroughRound) {
              onUndoBet();
            }
          }}
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
          <h2 className="text-xl font-bold tracking-tight">Phiên #{String(sessionNumber)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Đã chơi <strong className="text-foreground">{completedThroughRound}</strong> /{' '}
            {totalRounds} · Đã chi {formatAmount(accumulated)} đ
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sessionStatus === 'playing' && completedThroughRound > 0 ? (
            <Button variant="outline" size="sm" onClick={onUndoBet}>
              <RotateCcw className="h-4 w-4" />
              Hoàn tác
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => setViewMode('table')}>
            <Table2 className="h-4 w-4" />
            Xem bảng
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            Sửa ý định
          </Button>
          {onImprove !== undefined ? (
            <Button variant="outline" size="sm" onClick={onImprove}>
              <Sparkles className="h-4 w-4" />
              Cải thiện
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Timeline phiên</p>
          <SessionTimeline events={timeline} compact />
        </CardContent>
      </Card>

      {sessionStatus === 'won' ? (
        <Card className="border-success bg-success/10">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <PartyPopper className="h-10 w-10 text-success" />
            <p className="text-lg font-bold">Chúc mừng — bạn đã thắng!</p>
            <p className="text-sm text-muted-foreground">
              Phiên #{String(sessionNumber)} đã kết thúc. Xem lại trong Lịch sử.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {sessionStatus === 'playing' ? (
        <>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tiến độ</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${String(progressPct)}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
          </div>

          <div ref={listRef} className="space-y-3">
            <AnimatePresence mode="popLayout">
              {focusRounds.map((round) => (
                <motion.div
                  key={round.index}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: round.isDone ? 0.45 : 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25 }}
                  data-current={round.isCurrent ? 'true' : undefined}
                >
                  <Card
                    className={cn(
                      'overflow-hidden transition-shadow',
                      round.isCurrent && 'border-primary shadow-md ring-2 ring-primary/20',
                      round.isDone && 'bg-muted/40',
                    )}
                  >
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-full border',
                            round.isDone
                              ? 'border-success bg-success/20 text-success'
                              : 'border-border bg-card',
                          )}
                        >
                          {round.isDone ? <Check className="h-4 w-4" /> : '□'}
                        </div>
                        <div>
                          <p className="font-semibold">Vòng {round.index}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatAmount(round.betAmount)} đ
                          </p>
                        </div>
                        {round.isCurrent ? (
                          <Badge variant="default" className="ml-1">
                            Lần cược tiếp
                          </Badge>
                        ) : null}
                      </div>

                      {round.isCurrent && currentRound !== undefined ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => onPlaceBet(round.index)}
                            className="min-w-[100px]"
                          >
                            <Check className="h-4 w-4" />
                            Đã cược
                          </Button>
                          <Button variant="outline" onClick={() => onWin(round.index)}>
                            <Trophy className="h-4 w-4" />
                            Thắng
                          </Button>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {completedThroughRound > 0 && nextBet > 0 ? (
            <p className="text-center text-xs text-muted-foreground">
              Lần cược gần nhất: {formatAmount(nextBet)} đ
            </p>
          ) : null}
        </>
      ) : null}

      {allRoundsDone ? (
        <Card className="border-dashed">
          <CardContent className="space-y-4 p-5">
            <p className="font-medium">Bạn đã hoàn thành kế hoạch.</p>
            <p className="text-sm text-muted-foreground">Không có lượt thắng.</p>
            <p className="text-sm font-medium">Continue until</p>
            <div className="flex flex-wrap gap-2">
              {presetTargets.map((n) => (
                <Button
                  key={n}
                  variant={selectedContinue === n ? 'default' : 'outline'}
                  size="sm"
                  type="button"
                  onClick={() => {
                    setSelectedContinue(n);
                    setContinueTarget(String(n));
                  }}
                >
                  {n}
                </Button>
              ))}
              <Button
                variant={selectedContinue === -1 ? 'default' : 'outline'}
                size="sm"
                type="button"
                onClick={() => setSelectedContinue(-1)}
              >
                Custom
              </Button>
            </div>
            {selectedContinue === -1 ? (
              <Input
                type="number"
                min={totalRounds + 1}
                placeholder={`Ví dụ: ${String(totalRounds + 100)}`}
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
                    : (selectedContinue ?? totalRounds + 100);
                if (Number.isFinite(target) && target > totalRounds) {
                  onContinue(target);
                }
              }}
            >
              Tạo phần tiếp theo
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Vốn cần {formatAmount(statistics.requiredBankrollAmount)} đ
      </p>
    </div>
  );
}
