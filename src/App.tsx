import { simulateWinAtRound } from '@stake/constraint-engine';
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react';

import { ActionToast } from '@/components/ui/action-toast';
import { AnalysisScreen } from '@/features/analysis/AnalysisScreen';
import { AllocationScreen } from '@/features/allocation/AllocationScreen';
import { computeCapitalOverview } from '@/features/capital/capital-overview';
import { CapitalPlannerScreen } from '@/features/capital/CapitalPlannerScreen';
import type { CapitalSessionRecommendation } from '@/features/capital/capital-planner-types';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { DEFAULT_PRESET_ID } from '@/features/game-designer/builtin-presets';
import { GameDesignerScreen } from '@/features/game-designer/GameDesignerScreen';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import {
  applyPresetToForm,
  findPreset,
  mergePresets,
} from '@/features/game-designer/preset-utils';
import { SessionLibraryScreen } from '@/features/history/HistoryScreen';
import type { ImproveOption } from '@/features/improve/improve-service';
import { GeneratePlanScreen } from '@/features/planner/GeneratePlanScreen';
import {
  DEFAULT_PLANNER_FORM,
  generatePlan,
  type PlannerField,
  type PlannerFormValues,
} from '@/features/planner/plan-service';
import { FormRightPanel, PlanRightPanel, PlayingProgressPanel } from '@/features/planner/RightPanel';
import type { WorkspaceId } from '@/features/navigation/workspace-nav';
import {
  addPlanFromContinue,
  addPlanFromImprove,
  createSessionFromGenerate,
  getCurrentPlan,
  placeBetOnPlan,
  startCurrentPlan,
  stopSession,
  undoBetOnPlan,
  updateSessionNotes,
  winCurrentPlan,
  type Session,
  type SessionView,
} from '@/features/session/session-domain';
import { exportFullSessionJson, exportLibraryJson } from '@/features/session/session-export';
import { loadPersistedState, savePersistedState } from '@/features/session/session-persistence';
import { SessionPlannerScreen } from '@/features/session/SessionPlannerScreen';
import type { PersistedAppState } from '@/features/session/session-types';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { AppLayout } from '@/layout/AppLayout';

interface ToastState {
  readonly message: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

function findSession(sessions: readonly Session[], id: string | null): Session | null {
  if (id === null) {
    return null;
  }
  return sessions.find((s) => s.id === id) ?? null;
}

function upsertSession(sessions: readonly Session[], session: Session): Session[] {
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index < 0) {
    return [session, ...sessions];
  }
  return sessions.map((s, i) => (i === index ? session : s));
}

export function App(): JSX.Element {
  const [hydrated, setHydrated] = useState(false);
  const [persisted, setPersisted] = useState<PersistedAppState>(EMPTY_PERSISTED_STATE);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('dashboard');
  const [sessionView, setSessionView] = useState<SessionView>('overview');
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [liveForm, setLiveForm] = useState<PlannerFormValues>(DEFAULT_PLANNER_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PlannerField, string>>>({});
  const [toast, setToast] = useState<ToastState | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSession = findSession(persisted.sessions, persisted.activeSessionId);
  const displayedSession =
    findSession(persisted.sessions, viewingSessionId) ?? activeSession;
  const allPresets = useMemo(
    () => mergePresets(persisted.customGamePresets),
    [persisted.customGamePresets],
  );
  const activePreset = findPreset(allPresets, persisted.activePresetId);
  const continueMaxRounds = activePreset?.continuePolicy.maximumRounds ?? 5000;
  const currentPlan = activeSession !== null ? getCurrentPlan(activeSession) : null;
  const capitalOverview = useMemo(() => computeCapitalOverview(persisted), [persisted]);
  const readOnlySession = viewingSessionId !== null && viewingSessionId !== persisted.activeSessionId;

  useEffect(() => {
    void loadPersistedState().then((state) => {
      setPersisted(state);
      const presets = mergePresets(state.customGamePresets);
      const preset = findPreset(presets, state.activePresetId);
      const base = DEFAULT_PLANNER_FORM;
      setLiveForm(preset !== undefined ? applyPresetToForm(base, preset) : base);
      const hasActive = state.activeSessionId !== null;
      setActiveWorkspace(hasActive ? 'session' : 'dashboard');
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

  const updateSession = useCallback((sessionId: string, updater: (s: Session) => Session) => {
    setPersisted((prev) => {
      const target = findSession(prev.sessions, sessionId);
      if (target === null) {
        return prev;
      }
      const updated = updater(target);
      const next = {
        ...prev,
        sessions: upsertSession(prev.sessions, updated),
      };
      if (saveTimer.current !== null) {
        clearTimeout(saveTimer.current);
      }
      saveTimer.current = setTimeout(() => {
        void savePersistedState(next);
      }, 250);
      return next;
    });
  }, []);

  useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeWorkspace, sessionView]);

  function showToast(message: string, actionLabel?: string, onAction?: () => void): void {
    setToast({
      message,
      ...(actionLabel !== undefined ? { actionLabel } : {}),
      ...(onAction !== undefined ? { onAction } : {}),
    });
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
    let sessions = [...persisted.sessions];
    if (persisted.activeSessionId !== null) {
      const current = findSession(sessions, persisted.activeSessionId);
      if (current !== null && current.status === 'playing') {
        sessions = upsertSession(sessions, stopSession(current));
      }
    }

    const session = createSessionFromGenerate(
      values,
      outcome.result,
      persisted.activePresetId,
      persisted.nextSessionNumber,
    );

    persist({
      ...persisted,
      nextSessionNumber: persisted.nextSessionNumber + 1,
      activeSessionId: session.id,
      sessions: upsertSession(sessions, session),
    });
    setViewingSessionId(null);
    setSessionView('overview');
    setActiveWorkspace('session');
    showToast('Session mới đã tạo — Plan A sẵn sàng');
  }

  function handlePresetSelect(preset: GamePolicyPreset): void {
    const next = applyPresetToForm(liveForm, preset);
    setLiveForm(next);
    persist({ ...persisted, activePresetId: preset.id });
  }

  function handleSaveGamePreset(preset: GamePolicyPreset): void {
    const without = persisted.customGamePresets.filter((p) => p.id !== preset.id);
    persist({
      ...persisted,
      customGamePresets: [...without, preset],
      activePresetId: preset.id,
    });
    showToast(`Đã lưu preset "${preset.name}"`);
  }

  function handleDeleteGamePreset(id: string): void {
    const filtered = persisted.customGamePresets.filter((p) => p.id !== id);
    const nextPresetId =
      persisted.activePresetId === id ? DEFAULT_PRESET_ID : persisted.activePresetId;
    persist({
      ...persisted,
      customGamePresets: filtered,
      activePresetId: nextPresetId,
    });
    showToast('Đã xóa preset');
  }

  function mutateActive(updater: (s: Session) => Session): void {
    if (persisted.activeSessionId === null) {
      return;
    }
    updateSession(persisted.activeSessionId, updater);
  }

  function startPlan(): void {
    mutateActive((s) => startCurrentPlan(s));
  }

  function placeBet(roundIndex: number): void {
    if (persisted.activeSessionId === null) {
      return;
    }
    updateSession(persisted.activeSessionId, (s) => placeBetOnPlan(s, roundIndex) ?? s);
    showToast('Đã lưu cược', 'Hoàn tác', () => undoBet());
  }

  function undoBet(): void {
    if (persisted.activeSessionId === null) {
      return;
    }
    updateSession(persisted.activeSessionId, (s) => undoBetOnPlan(s) ?? s);
    showToast('Đã hoàn tác cược');
  }

  function winAtRound(roundIndex: number): void {
    if (persisted.activeSessionId === null) {
      return;
    }
    setPersisted((prev) => {
      const session = findSession(prev.sessions, prev.activeSessionId);
      if (session === null) {
        return prev;
      }
      const plan = getCurrentPlan(session);
      const sim =
        plan !== null ? simulateWinAtRound(plan.generated.strategy, roundIndex) : null;
      const profit = sim?.kind === 'success' ? sim.value.profitAmount : null;
      const updated = winCurrentPlan(session, roundIndex, profit);
      const next = {
        ...prev,
        activeSessionId: null,
        sessions: upsertSession(prev.sessions, updated),
      };
      void savePersistedState(next);
      return next;
    });
    showToast('Session kết thúc — thắng!');
    setSessionView('overview');
    setActiveWorkspace('session');
  }

  function handleContinue(targetRoundCount: number): void {
    if (persisted.activeSessionId === null) {
      return;
    }
    updateSession(persisted.activeSessionId, (s) => {
      const result = addPlanFromContinue(s, targetRoundCount);
      if (result.error !== undefined) {
        showToast(result.error);
        return s;
      }
      showToast(`Session Planner — plan mới đến ${String(targetRoundCount)} vòng`);
      return result.session;
    });
    setSessionView('overview');
  }

  function applyImprove(option: ImproveOption): void {
    if (persisted.activeSessionId === null) {
      return;
    }
    updateSession(persisted.activeSessionId, (s) => addPlanFromImprove(s, option));
    showToast('Improve — plan mới đã áp dụng');
    setSessionView('overview');
  }

  function handleNotesChange(notes: string): void {
    const id = viewingSessionId ?? persisted.activeSessionId;
    if (id === null) {
      return;
    }
    updateSession(id, (s) => updateSessionNotes(s, notes));
  }

  function handleCreateSessionFromCapital(rec: CapitalSessionRecommendation): void {
    let sessions = [...persisted.sessions];
    if (persisted.activeSessionId !== null) {
      const current = findSession(sessions, persisted.activeSessionId);
      if (current !== null && current.status === 'playing') {
        sessions = upsertSession(sessions, stopSession(current));
      }
    }

    const session = createSessionFromGenerate(
      rec.formValues,
      rec.result,
      persisted.capitalPlanner?.presetId ?? persisted.activePresetId,
      persisted.nextSessionNumber,
    );

    persist({
      ...persisted,
      nextSessionNumber: persisted.nextSessionNumber + 1,
      activeSessionId: session.id,
      sessions: upsertSession(sessions, session),
      activePresetId: persisted.capitalPlanner?.presetId ?? persisted.activePresetId,
    });
    setViewingSessionId(null);
    setSessionView('overview');
    setActiveWorkspace('session');
    showToast(`Session từ ${rec.label} — Plan A sẵn sàng`);
  }

  function handleStopSession(): void {
    if (persisted.activeSessionId === null) {
      return;
    }
    setPersisted((prev) => {
      const session = findSession(prev.sessions, prev.activeSessionId);
      if (session === null) {
        return prev;
      }
      const updated = stopSession(session);
      const next = {
        ...prev,
        activeSessionId: null,
        sessions: upsertSession(prev.sessions, updated),
      };
      void savePersistedState(next);
      return next;
    });
    showToast('Session đã dừng — xem trong Library');
    setViewingSessionId(null);
  }

  function handleExportSession(): void {
    if (displayedSession === null) {
      return;
    }
    exportFullSessionJson(displayedSession);
    showToast('Đã xuất session JSON');
  }

  function renderSessionWorkspace(): JSX.Element {
    if (displayedSession === null) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Chưa có session. Tạo từ Capital Planner.</p>
          <button
            type="button"
            className="text-sm font-medium text-primary underline"
            onClick={() => setActiveWorkspace('capital')}
          >
            Mở Capital Planner
          </button>
        </div>
      );
    }

    const preset = findPreset(allPresets, displayedSession.presetId);
  const isReadOnly =
      readOnlySession ||
      (displayedSession.status !== 'playing' && displayedSession.status !== 'draft');

    return (
      <SessionPlannerScreen
        session={displayedSession}
        preset={preset}
        view={sessionView}
        continueMaxRounds={continueMaxRounds}
        onViewChange={setSessionView}
        onStartPlan={isReadOnly ? () => undefined : startPlan}
        onPlaceBet={isReadOnly ? () => undefined : placeBet}
        onUndoBet={isReadOnly ? () => undefined : undoBet}
        onWin={isReadOnly ? () => undefined : winAtRound}
        onContinue={isReadOnly ? () => undefined : handleContinue}
        onApplyImprove={isReadOnly ? () => undefined : applyImprove}
        onNotesChange={handleNotesChange}
        onExport={handleExportSession}
        onStopSession={isReadOnly ? () => undefined : handleStopSession}
        readOnly={isReadOnly}
      />
    );
  }

  function renderMain(): JSX.Element {
    if (!hydrated) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Đang tải…
        </div>
      );
    }

    switch (activeWorkspace) {
      case 'dashboard':
        return (
          <DashboardScreen
            activeSession={activeSession}
            capitalOverview={capitalOverview}
            onOpenSession={() => {
              setViewingSessionId(null);
              setActiveWorkspace('session');
            }}
            onNewSession={() => {
              setViewingSessionId(null);
              setActiveWorkspace('capital');
            }}
            onOpenCapitalPlanner={() => setActiveWorkspace('capital')}
          />
        );
      case 'game-designer':
        return (
          <GameDesignerScreen
            customPresets={persisted.customGamePresets}
            activePresetId={persisted.activePresetId}
            onSavePreset={handleSaveGamePreset}
            onDeletePreset={handleDeleteGamePreset}
            onSelectPreset={(id) => {
              const preset = findPreset(allPresets, id);
              if (preset !== undefined) {
                handlePresetSelect(preset);
              }
            }}
          />
        );
      case 'capital':
        return (
          <CapitalPlannerScreen
            presets={allPresets}
            activePresetId={persisted.activePresetId}
            initialBankroll={
              persisted.capitalPlanner?.totalBankroll !== undefined
                ? persisted.capitalPlanner.totalBankroll.toLocaleString('vi-VN')
                : liveForm.userBankroll
            }
            initialStrategy={persisted.capitalPlanner?.strategy ?? 'balanced'}
            initialRisk={persisted.capitalPlanner?.risk ?? 'normal'}
            lastResult={persisted.capitalPlanner?.result ?? null}
            onPresetSelect={handlePresetSelect}
            onGenerate={({ bankroll, strategy, risk, presetId, result }) => {
              persist({
                ...persisted,
                activePresetId: presetId,
                capitalPlanner: {
                  totalBankroll: bankroll,
                  strategy,
                  risk,
                  presetId,
                  result,
                  generatedAt: new Date().toISOString(),
                },
              });
            }}
            onCreateSession={handleCreateSessionFromCapital}
          />
        );
      case 'session':
        return renderSessionWorkspace();
      case 'planning':
        return (
          <GeneratePlanScreen
            defaultValues={liveForm}
            presets={allPresets}
            activePresetId={persisted.activePresetId}
            onPresetSelect={handlePresetSelect}
            onValuesChange={setLiveForm}
            onSubmit={handleGenerate}
            {...(fieldErrors.request !== undefined ? { serverError: fieldErrors.request } : {})}
          />
        );
      case 'analysis':
        return (
          <AnalysisScreen
            generated={currentPlan?.generated ?? null}
            completedThroughRound={currentPlan?.completedThroughRound ?? 0}
            history={persisted.sessions.filter((s) => s.status === 'won' || s.status === 'lost')}
            onOpenImprove={() => {
              setActiveWorkspace('session');
              setSessionView('improve');
            }}
          />
        );
      case 'allocation':
        return <AllocationScreen />;
      case 'history':
        return (
          <SessionLibraryScreen
            sessions={persisted.sessions}
            activeSessionId={persisted.activeSessionId}
            onOpenSession={(id) => {
              setViewingSessionId(id);
              setSessionView('overview');
              setActiveWorkspace('session');
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
              exportLibraryJson(persisted.sessions);
              showToast('Đã xuất Session Library JSON');
            }}
          />
        );
      default:
        return renderSessionWorkspace();
    }
  }

  const showRightPanel =
    activeWorkspace === 'planning' ||
    (activeWorkspace === 'session' && sessionView === 'playing') ||
    activeWorkspace === 'analysis';

  const rightPanel =
    activeWorkspace === 'planning' ? (
      <FormRightPanel form={liveForm} />
    ) : currentPlan !== null && activeWorkspace === 'session' && sessionView === 'playing' ? (
      <>
        <PlayingProgressPanel
          completedThroughRound={currentPlan.completedThroughRound}
          totalRounds={currentPlan.generated.strategy.rounds.length}
        />
        <PlanRightPanel
          generated={currentPlan.generated}
          completedThroughRound={currentPlan.completedThroughRound}
        />
      </>
    ) : currentPlan !== null && activeWorkspace === 'analysis' ? (
      <PlanRightPanel
        generated={currentPlan.generated}
        completedThroughRound={currentPlan.completedThroughRound}
      />
    ) : (
      <FormRightPanel form={liveForm} />
    );

  return (
    <>
      <AppLayout
        activeWorkspace={activeWorkspace}
        onWorkspaceSelect={(ws) => {
          if (ws !== 'session') {
            setViewingSessionId(null);
          }
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
