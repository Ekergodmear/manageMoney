import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import type { ImproveOption } from '@/features/improve/improve-service';
import type { Session, SessionView } from '@/features/session/session-domain';
import {
  computeSessionStatistics,
  formatSessionTime,
  getCurrentPlan,
  isPlanExhausted,
  planOriginLabel,
  planStatusLabel,
  sessionPresetName,
} from '@/features/session/session-domain';
import { PlayingSessionScreen } from '@/features/playing/PlayingSessionScreen';
import { ImproveScreen } from '@/features/improve/ImproveScreen';
import { AnalysisScreen } from '@/features/analysis/AnalysisScreen';
import {
  Download,
  LineChart,
  Play,
  Sparkles,
  Square,
  StickyNote,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAmount } from '@/lib/money-format';
import { cn } from '@/lib/utils';

interface SessionPlannerScreenProps {
  readonly session: Session;
  readonly preset: GamePolicyPreset | undefined;
  readonly view: SessionView;
  readonly continueMaxRounds: number;
  readonly onViewChange: (view: SessionView) => void;
  readonly onStartPlan: () => void;
  readonly onPlaceBet: (roundIndex: number) => void;
  readonly onUndoBet: () => void;
  readonly onWin: (roundIndex: number) => void;
  readonly onContinue: (targetRoundCount: number) => void;
  readonly onApplyImprove: (option: ImproveOption) => void;
  readonly onNotesChange: (notes: string) => void;
  readonly onExport: () => void;
  readonly onStopSession: () => void;
  readonly readOnly?: boolean;
}

export function SessionPlannerScreen({
  session,
  preset,
  view,
  continueMaxRounds,
  onViewChange,
  onStartPlan,
  onPlaceBet,
  onUndoBet,
  onWin,
  onContinue,
  onApplyImprove,
  onNotesChange,
  onExport,
  onStopSession,
  readOnly = false,
}: SessionPlannerScreenProps): ReactNode {
  const currentPlan = getCurrentPlan(session);
  const stats = computeSessionStatistics(session);
  const [notesOpen, setNotesOpen] = useState(false);

  if (view === 'playing' && currentPlan !== null) {
    const playingStatus =
      currentPlan.status === 'won' ? 'won' : session.status === 'won' ? 'won' : 'playing';
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => onViewChange('overview')}>
          ← Session #{String(session.sessionNumber)}
        </Button>
        <PlayingSessionScreen
          generated={currentPlan.generated}
          sessionNumber={session.sessionNumber}
          completedThroughRound={currentPlan.completedThroughRound}
          timeline={session.timeline}
          sessionStatus={playingStatus}
          onPlaceBet={onPlaceBet}
          onUndoBet={onUndoBet}
          onWin={onWin}
          onContinue={onContinue}
          onResetProgress={() => undefined}
          onEdit={() => onViewChange('overview')}
          onImprove={() => onViewChange('improve')}
          continueMaxRounds={continueMaxRounds}
        />
      </div>
    );
  }

  if (view === 'improve' && currentPlan !== null) {
    return (
      <div className="space-y-4">
        <ImproveScreen
          formValues={currentPlan.formValues}
          generated={currentPlan.generated}
          completedThroughRound={currentPlan.completedThroughRound}
          onApply={(option) => {
            onApplyImprove(option);
            onViewChange('overview');
          }}
          onBack={() => onViewChange('overview')}
        />
      </div>
    );
  }

  if (view === 'simulate' && currentPlan !== null) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => onViewChange('overview')}>
          ← Session #{String(session.sessionNumber)}
        </Button>
        <AnalysisScreen
          generated={currentPlan.generated}
          completedThroughRound={currentPlan.completedThroughRound}
          history={[]}
          onOpenImprove={() => onViewChange('improve')}
        />
      </div>
    );
  }

  const currentExhausted = currentPlan !== null && isPlanExhausted(currentPlan);
  const canPlay =
    currentPlan !== null &&
    (currentPlan.status === 'ready' ||
      (currentPlan.status === 'playing' && !currentExhausted));

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{session.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Game <strong className="text-foreground">{sessionPresetName(preset)}</strong>
            {' · '}
            Started {formatSessionTime(session.startedAt)}
            {' · '}
            <Badge variant={session.status === 'playing' ? 'default' : 'outline'} className="align-middle">
              {session.status}
            </Badge>
          </p>
        </div>
        {session.status === 'playing' && !readOnly ? (
          <Button variant="outline" size="sm" onClick={onStopSession}>
            <Square className="h-4 w-4" />
            Kết thúc
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Plans</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {session.plans.map((plan) => {
            const isCurrent = plan.id === session.currentPlanId;
            const parent = plan.parentPlanId
              ? session.plans.find((p) => p.id === plan.parentPlanId)
              : null;
            return (
              <div
                key={plan.id}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-2 px-4 py-3',
                  isCurrent && 'bg-primary/5',
                )}
              >
                <div>
                  <p className="font-medium">
                    {plan.label}
                    {isCurrent ? (
                      <Badge variant="default" className="ml-2 text-[10px]">
                        Current
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {planOriginLabel(plan.origin)}
                    {parent !== null && parent !== undefined
                      ? ` · from ${parent.label}`
                      : ''}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <Badge variant="outline">{planStatusLabel(plan.status, isCurrent)}</Badge>
                  {isCurrent && currentPlan !== null ? (
                    <p className="mt-1 text-muted-foreground">
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="max-h-48 space-y-2 overflow-y-auto text-xs">
          {[...session.timeline].reverse().map((event, i) => (
            <div key={`${event.at}-${String(i)}`} className="flex gap-3">
              <span className="shrink-0 font-mono text-muted-foreground">
                {formatSessionTime(event.at)}
              </span>
              <span>
                {event.label ?? event.type.replace(/-/g, ' ')}
                {event.roundIndex !== undefined ? ` · vòng ${String(event.roundIndex)}` : ''}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Rounds played" value={String(stats.roundsPlayed)} />
        <Stat label="Plans" value={String(stats.planCount)} />
        <Stat label="Improve" value={String(stats.improveCount)} />
        <Stat label="Continue" value={String(stats.continueCount)} />
        <Stat label="Highest bet" value={`${formatAmount(stats.highestBet)} đ`} />
        <Stat label="Total capital" value={`${formatAmount(stats.totalCapital)} đ`} />
      </div>

      <div className="flex flex-wrap gap-2">
        {!readOnly && canPlay ? (
          <Button
            onClick={() => {
              if (currentPlan?.status === 'ready') {
                onStartPlan();
              }
              onViewChange('playing');
            }}
          >
            <Play className="h-4 w-4" />
            {currentPlan?.status === 'ready' ? 'Bắt đầu chơi' : 'Tiếp tục chơi'}
          </Button>
        ) : null}
        {currentPlan !== null && session.status !== 'won' && !readOnly ? (
          <>
            <Button variant="outline" onClick={() => onViewChange('improve')}>
              <Sparkles className="h-4 w-4" />
              Improve
            </Button>
            <Button variant="outline" onClick={() => onViewChange('simulate')}>
              <LineChart className="h-4 w-4" />
              Simulation
            </Button>
          </>
        ) : null}
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button variant="outline" onClick={() => setNotesOpen((v) => !v)}>
          <StickyNote className="h-4 w-4" />
          Notes
        </Button>
      </div>

      {notesOpen ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Session Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="min-h-[100px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={session.notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Casino đông. Lag. Đổi bàn..."
              rows={4}
            />
          </CardContent>
        </Card>
      ) : null}

      {currentExhausted && currentPlan?.status === 'playing' ? (
        <Card className="border-dashed border-warning/50">
          <CardContent className="p-4 text-sm">
            <p className="font-medium">{currentPlan.label} — hết vòng, chưa thắng.</p>
            <p className="mt-1 text-muted-foreground">
              Dùng Session Planner → Continue hoặc Improve để tạo plan tiếp theo.
            </p>
            <Button className="mt-3" size="sm" onClick={() => onViewChange('playing')}>
              Mở Session Planner (Continue)
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
