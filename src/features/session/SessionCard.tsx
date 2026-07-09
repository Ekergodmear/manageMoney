import type { ReactNode } from 'react';

import { accumulatedAtRound } from '@/features/planner/plan-display';
import type { GenerateResult } from '@/features/planner/plan-service';
import { formatAmount } from '@/lib/money-format';
import { cn } from '@/lib/utils';

interface SessionCardProps {
  readonly sessionNumber: number;
  readonly generated: GenerateResult;
  readonly completedThroughRound: number;
  readonly startedAt: Date;
  readonly className?: string;
}

export function SessionCard({
  sessionNumber,
  generated,
  completedThroughRound,
  startedAt,
  className,
}: SessionCardProps): ReactNode {
  const { strategy, statistics, request } = generated;
  const totalRounds = strategy.rounds.length;
  const accumulated = accumulatedAtRound(strategy.rounds, completedThroughRound);
  const targetAmount =
    request.targetProfit.mode === 'fixedAmount' ? request.targetProfit.amount : null;
  const lastBet =
    completedThroughRound > 0 ? (strategy.rounds[completedThroughRound - 1]?.betAmount ?? 0) : 0;
  const isActive = completedThroughRound < totalRounds;
  const timeLabel = startedAt.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={cn('rounded-xl border border-border bg-card px-4 py-3 shadow-sm', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              isActive ? 'bg-emerald-500' : 'bg-muted-foreground',
            )}
            aria-hidden
          />
          <span className="text-sm font-semibold">Phiên #{String(sessionNumber)}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Bắt đầu {timeLabel} · Game ×{String(request.rewardMultiplier)}
        </span>
      </div>

      <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Đã chơi</p>
          <p className="font-medium">
            {completedThroughRound} / {totalRounds} vòng
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Đã chi</p>
          <p className="font-medium">{formatAmount(accumulated)} đ</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Lần cược gần nhất</p>
          <p className="font-medium">{lastBet > 0 ? `${formatAmount(lastBet)} đ` : '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Mục tiêu</p>
          <p className="font-medium">
            {targetAmount !== null ? `${formatAmount(targetAmount)} đ` : '—'}
          </p>
        </div>
      </div>

      <p className="mt-2 text-xs font-medium text-muted-foreground">
        {isActive ? 'Chưa thắng' : 'Đã hết vòng trong kế hoạch'} · Vốn cần{' '}
        {formatAmount(statistics.requiredBankrollAmount)} đ
      </p>
    </div>
  );
}
