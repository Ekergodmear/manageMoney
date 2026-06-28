import { Play, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { accumulatedAtRound } from '@/features/planner/plan-display';
import type { Session } from '@/features/session/session-domain';
import { getCurrentPlan } from '@/features/session/session-domain';
import { formatAmount } from '@/lib/money-format';

interface DashboardScreenProps {
  readonly userName?: string;
  readonly activeSession: Session | null;
  readonly onOpenSession: () => void;
  readonly onNewSession: () => void;
}

export function DashboardScreen({
  userName = 'bạn',
  activeSession,
  onOpenSession,
  onNewSession,
}: DashboardScreenProps): ReactNode {
  const currentPlan = activeSession !== null ? getCurrentPlan(activeSession) : null;
  const hasActive =
    activeSession !== null &&
    (activeSession.status === 'playing' || activeSession.status === 'draft');

  if (!hasActive || activeSession === null || currentPlan === null) {
    return (
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Xin chào {userName}</h2>
        </div>
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-muted-foreground">Bạn chưa có session nào.</p>
            <Button onClick={onNewSession} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Session mới (Planning)
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
  const progressPct =
    totalRounds > 0 ? Math.round((completedThroughRound / totalRounds) * 100) : 0;
  const nextRound = currentPlan.generated.strategy.rounds[completedThroughRound];
  const nextBet = nextRound?.betAmount ?? 0;
  const barFilled = Math.max(1, Math.round(progressPct / 10));

  if (activeSession.status === 'draft' && currentPlan.status === 'ready') {
    return (
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Xin chào {userName}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Session sẵn sàng — mở Session để bắt đầu.</p>
        </div>
        <Card className="border-primary/20 shadow-md">
          <CardContent className="space-y-4 p-6">
            <p className="font-medium">
              {activeSession.title} · {currentPlan.label} · {totalRounds} vòng
            </p>
            <Button onClick={onOpenSession} className="w-full">
              <Play className="h-4 w-4" />
              Mở Session
            </Button>
            <Button variant="outline" onClick={onNewSession} className="w-full">
              Session mới
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

      <Card className="border-primary/20 shadow-md">
        <CardContent className="space-y-5 p-6">
          <div>
            <p className="text-sm text-muted-foreground">{currentPlan.label}</p>
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

          <Button onClick={onOpenSession} className="w-full" size="lg">
            <Play className="h-4 w-4" />
            Mở Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
