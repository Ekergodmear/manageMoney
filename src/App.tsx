import { simulateWinAtRound } from '@stake/constraint-engine';
import { useCallback, useEffect, useRef, useState, type JSX } from 'react';

import { ActionToast } from '@/components/ui/action-toast';
import { AnalysisScreen } from '@/features/analysis/AnalysisScreen';
import { AllocationScreen } from '@/features/allocation/AllocationScreen';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { HistoryScreen } from '@/features/history/HistoryScreen';
import { applyImproveOption, type ImproveOption } from '@/features/improve/improve-service';
import { ImproveScreen } from '@/features/improve/ImproveScreen';
import { PlanReadyScreen } from '@/features/planner/PlanReadyScreen';
import {
  DEFAULT_PLANNER_FORM,
  continuePlan,
  generatePlan,
  type PlannerField,
  type PlannerFormValues,
} from '@/features/planner/plan-service';
import { FormRightPanel, PlanRightPanel, PlayingProgressPanel } from '@/features/planner/RightPanel';
import { PlayingSessionScreen } from '@/features/playing/PlayingSessionScreen';
import type { WorkspaceId } from '@/features/navigation/workspace-nav';
import { exportSessionJson, exportHistoryJson, printSession } from '@/features/session/session-export';
import { loadPersistedState, savePersistedState } from '@/features/session/session-persistence';
import type {
  ActiveSession,
  HistorySession,
  PersistedAppState,
  SessionTimelineEvent,
} from '@/features/session/session-types';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { AppLayout } from '@/layout/AppLayout';
import { accumulatedAtRound } from '@/features/planner/plan-display';

type PlanningPhase = 'form' | 'ready' | 'improve';

interface ToastState {
  readonly message: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

function nowIso(): string {
  return new Date().toISOString();
}

function addTimelineEvent(
  timeline: readonly SessionTimelineEvent[],
  event: Omit<SessionTimelineEvent, 'at'>,
): SessionTimelineEvent[] {
  return [...timeline, { ...event, at: nowIso() }];
}

function sessionToHistory(
  session: ActiveSession,
  outcome: HistorySession['outcome'],
  profitAmount: number | null,
): HistorySession {
  return {
    id: session.id,
    sessionNumber: session.sessionNumber,
    label: `Phiên ${String(session.sessionNumber)}`,
    roundCount: session.generated.strategy.rounds.length,
    completedRounds: session.completedThroughRound,
    outcome,
    profitAmount,
    totalSpent: accumulatedAtRound(
      session.generated.strategy.rounds,
      session.completedThroughRound,
    ),
    finishedAt: nowIso(),
    formValues: session.formValues,
    generated: session.generated,
    timeline: session.timeline,
  };
}

export function App(): JSX.Element {
  const [hydrated, setHydrated] = useState(false);
  const [persisted, setPersisted] = useState<PersistedAppState>(EMPTY_PERSISTED_STATE);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('dashboard');
  const [planningPhase, setPlanningPhase] = useState<PlanningPhase>('form');
  const [liveForm, setLiveForm] = useState<PlannerFormValues>(DEFAULT_PLANNER_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PlannerField, string>>>({});
  const [viewingHistory, setViewingHistory] = useState<HistorySession | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSession = persisted.activeSession;
  const formValues = activeSession?.formValues ?? DEFAULT_PLANNER_FORM;
  const generated = activeSession?.generated ?? null;
  const completedThroughRound = activeSession?.completedThroughRound ?? 0;
  const sessionStatus = activeSession?.status ?? 'ready';
  const timeline = activeSession?.timeline ?? [];

  useEffect(() => {
    void loadPersistedState().then((state) => {
      setPersisted(state);
      setLiveForm(state.activeSession?.formValues ?? DEFAULT_PLANNER_FORM);
      if (state.activeSession?.status === 'ready') {
        setPlanningPhase('ready');
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', persisted.theme === 'dark');
  }, [persisted.theme]);

  const persist = useCallback((next: PersistedAppState) => {
    setPersisted(next);
    if (saveTimer.current !== null) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(() => {
      void savePersistedState(next);
    }, 250);
  }, []);

  const updateActiveSession = useCallback(
    (updater: (session: ActiveSession) => ActiveSession) => {
      setPersisted((prev) => {
        if (prev.activeSession === null) {
          return prev;
        }
        const next = {
          ...prev,
          activeSession: updater(prev.activeSession),
        };
        if (saveTimer.current !== null) {
          clearTimeout(saveTimer.current);
        }
        saveTimer.current = setTimeout(() => {
          void savePersistedState(next);
        }, 250);
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeWorkspace, planningPhase]);

  function showToast(message: string, actionLabel?: string, onAction?: () => void): void {
    setToast({ message, ...(actionLabel !== undefined ? { actionLabel } : {}), ...(onAction !== undefined ? { onAction } : {}) });
    setTimeout(() => setToast(null), 4000);
  }

  function handleGenerate(values: PlannerFormValues): void {
    const outcome = generatePlan(values);
    if (outcome.fieldErrors !== undefined) {
      setFieldErrors(outcome.fieldErrors);
      return;
    }
    if (outcome.result === undefined) {
      return;
    }

    setFieldErrors({});
    const id = crypto.randomUUID();
    const sessionNumber = persisted.nextSessionNumber;
    const session: ActiveSession = {
      id,
      sessionNumber,
      status: 'ready',
      formValues: values,
      generated: outcome.result,
      completedThroughRound: 0,
      timeline: addTimelineEvent([], { type: 'generated' }),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    const archived =
      persisted.activeSession !== null && persisted.activeSession.status === 'playing'
        ? [
            sessionToHistory(persisted.activeSession, 'cancelled', null),
            ...persisted.history,
          ]
        : persisted.history;

    persist({
      ...persisted,
      nextSessionNumber: sessionNumber + 1,
      activeSession: session,
      history: archived,
    });
    setPlanningPhase('ready');
    setActiveWorkspace('planning');
    setViewingHistory(null);
  }

  function startSession(): void {
    updateActiveSession((s) => ({
      ...s,
      status: 'playing',
      timeline: addTimelineEvent(s.timeline, { type: 'started' }),
      updatedAt: nowIso(),
    }));
    setActiveWorkspace('playing');
  }

  function placeBet(roundIndex: number): void {
    if (activeSession === null || sessionStatus !== 'playing') {
      return;
    }
    const expected = activeSession.completedThroughRound + 1;
    if (roundIndex !== expected) {
      return;
    }
    const round = activeSession.generated.strategy.rounds[roundIndex - 1];
    updateActiveSession((s) => ({
      ...s,
      completedThroughRound: roundIndex,
      timeline: addTimelineEvent(s.timeline, {
        type: 'bet',
        roundIndex,
        betAmount: round?.betAmount,
      }),
      updatedAt: nowIso(),
    }));
    showToast('Đã lưu cược', 'Hoàn tác', undoBet);
  }

  function undoBet(): void {
    if (activeSession === null || activeSession.completedThroughRound <= 0) {
      return;
    }
    updateActiveSession((s) => ({
      ...s,
      completedThroughRound: s.completedThroughRound - 1,
      timeline: addTimelineEvent(s.timeline, { type: 'undo' }),
      updatedAt: nowIso(),
    }));
    showToast('Đã hoàn tác cược');
  }

  function winAtRound(roundIndex: number): void {
    setPersisted((prev) => {
      if (prev.activeSession === null) {
        return prev;
      }
      const sim = simulateWinAtRound(prev.activeSession.generated.strategy, roundIndex);
      const profit = sim.kind === 'success' ? sim.value.profitAmount : null;
      const completed = Math.max(prev.activeSession.completedThroughRound, roundIndex);
      const finalSession: ActiveSession = {
        ...prev.activeSession,
        completedThroughRound: completed,
        status: 'won',
        timeline: addTimelineEvent(prev.activeSession.timeline, { type: 'won', roundIndex }),
        updatedAt: nowIso(),
      };
      const historyEntry = sessionToHistory(finalSession, 'won', profit);
      const next = {
        ...prev,
        activeSession: null,
        history: [historyEntry, ...prev.history],
      };
      void savePersistedState(next);
      return next;
    });
    showToast('Chúc mừng — phiên đã kết thúc!');
    setActiveWorkspace('dashboard');
  }

  function handleContinue(targetRoundCount: number): void {
    if (activeSession === null) {
      return;
    }
    const outcome = continuePlan(activeSession.formValues, targetRoundCount);
    if (outcome.fieldErrors !== undefined || outcome.result === undefined) {
      showToast('Không tạo được phần tiếp theo — kiểm tra số vòng.');
      return;
    }
    updateActiveSession((s) => ({
      ...s,
      generated: outcome.result!,
      formValues: { ...s.formValues, roundCount: String(targetRoundCount) },
      timeline: addTimelineEvent(s.timeline, {
        type: 'continued',
        label: `Mở rộng đến ${String(targetRoundCount)} vòng`,
      }),
      updatedAt: nowIso(),
    }));
    showToast(`Đã thêm vòng đến ${String(targetRoundCount)}`);
  }

  function resetProgress(): void {
    updateActiveSession((s) => ({
      ...s,
      completedThroughRound: 0,
      updatedAt: nowIso(),
    }));
  }

  function applyImprove(option: ImproveOption): void {
    if (activeSession === null) {
      return;
    }
    const newFormValues = applyImproveOption(activeSession.formValues, option);
    const newRoundCount = option.result.strategy.rounds.length;
    const cappedCompleted = Math.min(activeSession.completedThroughRound, newRoundCount);
    updateActiveSession((s) => ({
      ...s,
      formValues: newFormValues,
      generated: option.result,
      completedThroughRound: cappedCompleted,
      timeline: addTimelineEvent(s.timeline, {
        type: 'continued',
        label: `Improve: ${option.label}`,
      }),
      updatedAt: nowIso(),
    }));
    setPlanningPhase('ready');
    setActiveWorkspace('planning');
    showToast('Đã áp dụng phương án cải thiện');
  }

  function openImprove(): void {
    setPlanningPhase('improve');
    setActiveWorkspace('planning');
  }

  function handleExport(): void {
    if (activeSession === null) {
      return;
    }
    exportSessionJson(activeSession.generated, {
      sessionNumber: activeSession.sessionNumber,
      completedThroughRound: activeSession.completedThroughRound,
    });
    showToast('Đã xuất JSON');
  }

  function handlePrint(): void {
    if (activeSession === null) {
      return;
    }
    printSession(activeSession, activeSession.completedThroughRound);
  }

  function renderPlanning(): JSX.Element {
    if (planningPhase === 'improve' && generated !== null) {
      return (
        <ImproveScreen
          formValues={formValues}
          generated={generated}
          completedThroughRound={completedThroughRound}
          onApply={applyImprove}
          onBack={() => {
            if (activeSession?.status === 'playing') {
              setPlanningPhase('ready');
              setActiveWorkspace('playing');
            } else if (generated !== null) {
              setPlanningPhase('ready');
            } else {
              setPlanningPhase('form');
            }
          }}
        />
      );
    }
    if (planningPhase === 'ready' && generated !== null) {
      return (
        <PlanReadyScreen
          generated={generated}
          onEdit={() => setPlanningPhase('form')}
          onStart={startSession}
          onViewTable={() => {
            startSession();
          }}
          onSimulate={() => setActiveWorkspace('analysis')}
          onExport={handleExport}
          onPrint={handlePrint}
          onImprove={openImprove}
        />
      );
    }
    return (
      <GeneratePlanScreen
        defaultValues={formValues}
        onValuesChange={setLiveForm}
        onSubmit={handleGenerate}
        {...(fieldErrors.request !== undefined ? { serverError: fieldErrors.request } : {})}
      />
    );
  }

  function renderPlaying(): JSX.Element {
    if (viewingHistory !== null) {
      return (
        <PlayingSessionScreen
          generated={viewingHistory.generated}
          sessionNumber={viewingHistory.sessionNumber}
          completedThroughRound={viewingHistory.completedRounds}
          timeline={viewingHistory.timeline}
          sessionStatus={viewingHistory.outcome === 'won' ? 'won' : 'lost'}
          onPlaceBet={() => undefined}
          onUndoBet={() => undefined}
          onWin={() => undefined}
          onContinue={() => undefined}
          onResetProgress={() => undefined}
          onEdit={() => undefined}
        />
      );
    }
    if (generated === null || activeSession === null) {
      return renderPlanning();
    }
    return (
      <PlayingSessionScreen
        generated={generated}
        sessionNumber={activeSession.sessionNumber}
        completedThroughRound={completedThroughRound}
        timeline={timeline}
        sessionStatus={sessionStatus === 'ready' ? 'playing' : sessionStatus}
        onPlaceBet={placeBet}
        onUndoBet={undoBet}
        onWin={winAtRound}
        onContinue={handleContinue}
        onResetProgress={resetProgress}
        onEdit={() => {
          setPlanningPhase('form');
          setActiveWorkspace('planning');
        }}
        onImprove={openImprove}
      />
    );
  }

  function renderMain(): JSX.Element {
    if (!hydrated) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Đang tải phiên…
        </div>
      );
    }

    switch (activeWorkspace) {
      case 'dashboard':
        return (
          <DashboardScreen
            activeSession={activeSession}
            onContinueSession={() => {
              if (activeSession?.status === 'ready') {
                setPlanningPhase('ready');
                setActiveWorkspace('planning');
              } else {
                setViewingHistory(null);
                setActiveWorkspace('playing');
              }
            }}
            onNewPlan={() => {
              setViewingHistory(null);
              setPlanningPhase('form');
              setActiveWorkspace('planning');
            }}
          />
        );
      case 'planning':
        return renderPlanning();
      case 'playing':
        return renderPlaying();
      case 'analysis':
        return (
          <AnalysisScreen
            generated={generated}
            completedThroughRound={completedThroughRound}
            history={persisted.history}
            onOpenImprove={generated !== null ? openImprove : undefined}
          />
        );
      case 'allocation':
        return <AllocationScreen />;
      case 'history':
        return (
          <HistoryScreen
            history={persisted.history}
            onOpenSession={(id) => {
              const item = persisted.history.find((h) => h.id === id);
              if (item !== undefined) {
                setViewingHistory(item);
                setActiveWorkspace('playing');
              }
            }}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            theme={persisted.theme}
            onThemeChange={(dark) =>
              persist({ ...persisted, theme: dark ? 'dark' : 'light' })
            }
            onExportHistory={() => {
              exportHistoryJson(persisted.history);
              showToast('Đã xuất lịch sử JSON');
            }}
          />
        );
      default:
        return renderPlanning();
    }
  }

  const showRightPanel =
    (activeWorkspace === 'planning' && planningPhase !== 'improve') ||
    activeWorkspace === 'playing' ||
    activeWorkspace === 'analysis';

  const rightPanel =
    activeWorkspace === 'planning' && planningPhase === 'form' ? (
      <FormRightPanel form={liveForm} />
    ) : generated !== null && activeWorkspace === 'playing' ? (
      <>
        <PlayingProgressPanel
          completedThroughRound={completedThroughRound}
          totalRounds={generated.strategy.rounds.length}
        />
        <PlanRightPanel generated={generated} completedThroughRound={completedThroughRound} />
      </>
    ) : generated !== null && (activeWorkspace === 'planning' || activeWorkspace === 'analysis') ? (
      <PlanRightPanel generated={generated} completedThroughRound={completedThroughRound} />
    ) : (
      <FormRightPanel form={liveForm} />
    );

  return (
    <>
      <AppLayout
        activeWorkspace={activeWorkspace}
        onWorkspaceSelect={(ws) => {
          setViewingHistory(null);
          setActiveWorkspace(ws);
        }}
        theme={persisted.theme}
        onThemeChange={(dark) => persist({ ...persisted, theme: dark ? 'dark' : 'light' })}
        showRightPanel={showRightPanel}
        main={renderMain()}
        rightPanel={rightPanel}
      />
      {toast !== null ? (
        <ActionToast
          message={toast.message}
          {...(toast.actionLabel !== undefined ? { actionLabel: toast.actionLabel } : {})}
          {...(toast.onAction !== undefined ? { onAction: toast.onAction } : {})}
          onClose={() => setToast(null)}
        />
      ) : null}
    </>
  );
}
