import { Play, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { accumulatedAtRound } from '@/features/planner/plan-display';
import type { ActiveSession } from '@/features/session/session-types';
import { formatAmount } from '@/lib/money-format';

interface DashboardScreenProps {
  readonly userName?: string;
  readonly activeSession: ActiveSession | null;
  readonly onContinueSession: () => void;
  readonly onNewPlan: () => void;
}

export function DashboardScreen({
  userName = 'bạn',
  activeSession,
  onContinueSession,
  onNewPlan,
}: DashboardScreenProps): ReactNode {
  const playing =
    activeSession !== null &&
    (activeSession.status === 'playing' || activeSession.status === 'ready');

  if (!playing || activeSession === null) {
    return (
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Xin chào {userName}</h2>
        </div>
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-muted-foreground">Bạn chưa có phiên nào.</p>
            <Button onClick={onNewPlan} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Tạo kế hoạch
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { generated, completedThroughRound, status, sessionNumber } = activeSession;
  const totalRounds = generated.strategy.rounds.length;
  const accumulated = accumulatedAtRound(generated.strategy.rounds, completedThroughRound);
  const progressPct =
    totalRounds > 0 ? Math.round((completedThroughRound / totalRounds) * 100) : 0;
  const nextRound = generated.strategy.rounds[completedThroughRound];
  const nextBet = nextRound?.betAmount ?? 0;
  const barFilled = Math.max(1, Math.round(progressPct / 10));

  if (status === 'ready') {
    return (
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Xin chào {userName}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Bạn có kế hoạch sẵn sàng — bắt đầu phiên khi đã sẵn sàng.
          </p>
        </div>
        <Card className="border-primary/20 shadow-md">
          <CardContent className="space-y-4 p-6">
            <p className="font-medium">Kế hoạch {totalRounds} vòng đã tạo</p>
            <Button onClick={onContinueSession} className="w-full">
              <Play className="h-4 w-4" />
              Xem kế hoạch & bắt đầu
            </Button>
            <Button variant="outline" onClick={onNewPlan} className="w-full">
              Tạo kế hoạch mới
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
          Bạn đang có <strong className="text-foreground">1 phiên đang chơi</strong>.
        </p>
      </div>

      <Card className="border-primary/20 shadow-md">
        <CardContent className="space-y-5 p-6">
          <div>
            <p className="text-sm text-muted-foreground">Phiên #{String(sessionNumber)}</p>
            <p className="mt-1 text-lg font-semibold">
              Đã chơi {completedThroughRound} / {totalRounds}
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
            <p className="text-xs text-muted-foreground">Lần cược tiếp</p>
            <p className="text-xl font-bold">
              {nextBet > 0 ? `${formatAmount(nextBet)} đ` : '—'}
            </p>
          </div>

          <Button onClick={onContinueSession} className="w-full" size="lg">
            <Play className="h-4 w-4" />
            Tiếp tục chơi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
