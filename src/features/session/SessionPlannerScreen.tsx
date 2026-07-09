import type {
  GamePolicyPreset,
  ContinuePolicyConfig,
} from '@/features/game-designer/game-policy-types';
import { marketPlanLabelFromPreset } from '@/features/game-data/markets/market-catalog';
import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';
import type { ImproveOption } from '@/features/improve/improve-service';
import { ImproveCandidateReviewScreen } from '@/features/improve/ImproveCandidateReviewScreen';
import type { PlanCandidate } from '@/features/planning/plan-candidate-types';
import { isAppendPlanCandidate } from '@/features/planning/plan-candidate-types';
import type { Session, SessionView } from '@/features/session/session-domain';
import { computeSessionStatistics, getCurrentPlan } from '@/features/session/session-domain';
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
  readonly continuePolicy: ContinuePolicyConfig;
  readonly planCandidate: PlanCandidate | null;
  readonly latestDraw: CollectorDrawResult | null;
  readonly onViewChange: (view: SessionView) => void;
  readonly onStartPlan: () => void;
  readonly onContinue: (targetRoundCount: number) => void;
  readonly onSelectImproveOption: (option: ImproveOption) => void;
  readonly onPromoteCandidate: () => void;
  readonly onDiscardCandidate: () => void;
  readonly onNotesChange: (notes: string) => void;
  readonly onExport: () => void;
  readonly onStopSession: () => void;
  readonly readOnly?: boolean;
  readonly onTitleChange?: (title: string) => void;
  readonly minimalMode?: boolean;
}

export function SessionPlannerScreen({
  session,
  preset,
  view,
  continuePolicy,
  planCandidate,
  latestDraw,
  onViewChange,
  onStartPlan,
  onContinue,
  onSelectImproveOption,
  onPromoteCandidate,
  onDiscardCandidate,
  onNotesChange,
  onExport,
  onStopSession,
  readOnly = false,
  onTitleChange,
  minimalMode = false,
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onViewChange('overview');
          }}
        >
          ← Cockpit
        </Button>
        <PlayingSessionScreen
          sessionTitle={session.title}
          generated={currentPlan.generated}
          sessionNumber={session.sessionNumber}
          completedThroughRound={currentPlan.completedThroughRound}
          timeline={session.timeline}
          sessionStatus={playingStatus}
          betMarketLabel={
            preset !== undefined
              ? marketPlanLabelFromPreset(preset, currentPlan.marketId)
              : currentPlan.marketId
          }
          latestDraw={latestDraw}
          playedRounds={session.playedRounds}
          autoSettlement={session.status === 'playing'}
          focusRoundIndex={focusRoundIndex}
          onFocusRoundHandled={() => {
            setFocusRoundIndex(null);
          }}
          onContinue={onContinue}
          onResetProgress={() => undefined}
          onEdit={() => {
            onViewChange('overview');
          }}
          onImprove={() => {
            onViewChange('improve');
          }}
          hideContinue={minimalMode}
          continuePolicy={continuePolicy}
        />
      </div>
    );
  }

  if (
    view === 'improve-review' &&
    planCandidate !== null &&
    isAppendPlanCandidate(planCandidate) &&
    currentPlan !== null
  ) {
    return (
      <div className="space-y-4">
        <ImproveCandidateReviewScreen
          candidate={planCandidate}
          parentGenerated={currentPlan.generated}
          onBack={() => {
            onViewChange('improve');
          }}
          onPromote={onPromoteCandidate}
          onDiscard={onDiscardCandidate}
        />
      </div>
    );
  }

  if (view === 'improve' && currentPlan !== null) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onViewChange('overview');
          }}
        >
          ← Cockpit
        </Button>
        {planCandidate !== null && isAppendPlanCandidate(planCandidate) ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onViewChange('improve-review');
            }}
          >
            Xem lại phương án đang chờ
          </Button>
        ) : null}
        <ImproveScreen
          formValues={currentPlan.formValues}
          generated={currentPlan.generated}
          completedThroughRound={currentPlan.completedThroughRound}
          onSelectOption={onSelectImproveOption}
          onBack={() => {
            onViewChange('overview');
          }}
        />
      </div>
    );
  }

  if (!minimalMode && view === 'simulate' && currentPlan !== null) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onViewChange('overview');
          }}
        >
          ← Cockpit
        </Button>
        <AnalysisScreen
          generated={currentPlan.generated}
          completedThroughRound={currentPlan.completedThroughRound}
          history={[]}
          onOpenImprove={() => {
            onViewChange('improve');
          }}
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
      onStartPlaying={() => {
        goToPlaying();
      }}
      onNavigateToRound={(roundIndex) => {
        goToPlaying(roundIndex);
      }}
      onImprove={() => {
        onViewChange('improve');
      }}
      {...(minimalMode
        ? {}
        : {
            onSimulate: () => {
              onViewChange('simulate');
            },
          })}
      minimalMode={minimalMode}
      onExport={onExport}
      onStopSession={onStopSession}
      onNotesChange={onNotesChange}
      {...(onTitleChange !== undefined ? { onTitleChange } : {})}
    />
  );
}
