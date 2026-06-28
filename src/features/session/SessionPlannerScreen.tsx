import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import type { ImproveOption } from '@/features/improve/improve-service';
import type { Session, SessionView } from '@/features/session/session-domain';
import {
  computeSessionStatistics,
  getCurrentPlan,
} from '@/features/session/session-domain';
import { PlayingSessionScreen } from '@/features/playing/PlayingSessionScreen';
import { ImproveScreen } from '@/features/improve/ImproveScreen';
import { AnalysisScreen } from '@/features/analysis/AnalysisScreen';
import { SessionCockpit } from '@/features/session/SessionCockpit';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';

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
  const [focusRoundIndex, setFocusRoundIndex] = useState<number | null>(null);

  function goToPlaying(roundIndex?: number): void {
    if (currentPlan?.status === 'ready') {
      onStartPlan();
    }
    if (roundIndex !== undefined) {
      setFocusRoundIndex(roundIndex);
    }
    onViewChange('playing');
  }

  if (view === 'playing' && currentPlan !== null) {
    const playingStatus =
      currentPlan.status === 'won' ? 'won' : session.status === 'won' ? 'won' : 'playing';
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => onViewChange('overview')}>
          ← Cockpit
        </Button>
        <PlayingSessionScreen
          sessionTitle={session.title}
          generated={currentPlan.generated}
          sessionNumber={session.sessionNumber}
          completedThroughRound={currentPlan.completedThroughRound}
          timeline={session.timeline}
          sessionStatus={playingStatus}
          focusRoundIndex={focusRoundIndex}
          onFocusRoundHandled={() => setFocusRoundIndex(null)}
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
        <Button variant="ghost" size="sm" onClick={() => onViewChange('overview')}>
          ← Cockpit
        </Button>
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
          ← Cockpit
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

  return (
    <SessionCockpit
      session={session}
      preset={preset}
      stats={stats}
      readOnly={readOnly}
      onStartPlaying={() => goToPlaying()}
      onNavigateToRound={(roundIndex) => goToPlaying(roundIndex)}
      onImprove={() => onViewChange('improve')}
      onSimulate={() => onViewChange('simulate')}
      onExport={onExport}
      onStopSession={onStopSession}
      onNotesChange={onNotesChange}
    />
  );
}
