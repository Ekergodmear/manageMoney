import { simulateWinAtRound } from '@stake/constraint-engine';
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react';

import { ActionToast } from '@/components/ui/action-toast';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/design/theme/provider';
import { AppServicesProvider, useServices } from '@/services/registry/AppServicesProvider';
import { InsightsScreen } from '@/features/insights/InsightsScreen';
import { AllocationScreen } from '@/features/allocation/AllocationScreen';
import { computeCapitalOverview } from '@/features/capital/capital-overview';
import { CapitalPlannerScreen } from '@/features/capital/CapitalPlannerScreen';
import { createCandidateFromRecommendationUseCase } from '@/features/capital/create-candidate-from-recommendation-use-case';
import { createGenerateCapitalRecommendationsUseCase } from '@/features/capital/generate-capital-recommendations-use-case';
import { createPromoteCandidateToSessionUseCase } from '@/features/capital/promote-candidate-to-session-use-case';
import { createContinuePlanUseCase } from '@/features/continue/continue-plan-use-case';
import type { CapitalPlannerInput } from '@/features/capital/capital-planner-types';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { DEFAULT_PRESET_ID } from '@/features/game-designer/builtin-presets';
import { GameDesignerScreen } from '@/features/game-designer/GameDesignerScreen';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import {
  applyPresetToForm,
  findPreset,
  mergePresets,
} from '@/features/game-designer/preset-utils';
import {
  duplicateSession,
  toggleSessionArchived,
  toggleSessionFavorite,
  updateSessionTags,
} from '@/features/library/library-actions';
import type { LibraryCollection } from '@/features/library/library-types';
import { SessionLibraryScreen } from '@/features/library/SessionLibraryScreen';
import { ImproveCandidateReviewScreen } from '@/features/improve/ImproveCandidateReviewScreen';
import { createImprovementCandidateUseCase } from '@/features/improve/create-improvement-candidate-use-case';
import type { ImproveOption } from '@/features/improve/improve-service';
import { createPromoteCandidateToPlanUseCase } from '@/features/improve/promote-candidate-to-plan-use-case';
import { GeneratePlanScreen } from '@/features/planner/GeneratePlanScreen';
import { DecisionScreen } from '@/features/planner/DecisionScreen';
import { PlanTableScreen } from '@/features/planner/PlanTableScreen';
import {
  DEFAULT_PLANNER_FORM,
  type PlannerField,
  type PlannerFormValues,
} from '@/features/planner/plan-service';
import {
  createGeneratePlanUseCase,
  createPromotePlanningDraftUseCase,
  type PlanningView,
} from '@/features/planning';
import { isNewSessionCandidate } from '@/features/planning/plan-candidate-types';
import { PlanningDraftRepository } from '@/services/storage/repositories/planning-draft-repository';
import { PlanCandidateRepository } from '@/services/storage/repositories/plan-candidate-repository';
import { SessionRepository } from '@/services/storage/repositories/session-repository';
import { RecommendationSetRepository } from '@/services/storage/repositories/recommendation-set-repository';
import { FormRightPanel, PlanRightPanel, PlayingProgressPanel } from '@/features/planner/RightPanel';
import type { WorkspaceId } from '@/features/navigation/workspace-nav';
import {
  getCurrentPlan,
  placeBetOnPlan,
  setBetProgressOnPlan,
  startCurrentPlan,
  stopSession,
  undoBetOnPlan,
  updateSessionNotes,
  updateSessionTitle,
  winCurrentPlan,
  type Session,
  type SessionView,
} from '@/features/session/session-domain';
import { exportFullSessionJson, exportLibraryJson, exportSessionPrint } from '@/features/session/session-export';
import { loadPersistedState, savePersistedState } from '@/features/session/session-persistence';
import { SessionPlannerScreen } from '@/features/session/SessionPlannerScreen';
import type { PersistedAppState } from '@/features/session/session-types';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { createGenerateExperimentRecommendationsUseCase } from '@/features/experiment/generate-experiment-recommendations-use-case';
import type { Experiment } from '@/features/experiment/experiment-types';
import { ScenarioPlannerScreen } from '@/features/experiment/ScenarioPlannerScreen';
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
  return (
    <AppServicesProvider>
      <AppRoot />
    </AppServicesProvider>
  );
}

function AppRoot(): JSX.Element {
  const services = useServices();
  const planningDraftRepository = useMemo(
    () => new PlanningDraftRepository(services.storage),
    [services.storage],
  );
  const sessionRepository = useMemo(
    () => new SessionRepository(services.storage),
    [services.storage],
  );
  const planCandidateRepository = useMemo(
    () => new PlanCandidateRepository(services.storage),
    [services.storage],
  );
  const recommendationSetRepository = useMemo(
    () => new RecommendationSetRepository(services.storage),
    [services.storage],
  );
  const generatePlanUseCase = useMemo(
    () =>
      createGeneratePlanUseCase({
        planningDrafts: planningDraftRepository,
        events: services.events,
        clock: services.clock,
      }),
    [planningDraftRepository, services.events, services.clock],
  );
  const promotePlanningDraftUseCase = useMemo(
    () =>
      createPromotePlanningDraftUseCase({
        planningDrafts: planningDraftRepository,
        sessions: sessionRepository,
        events: services.events,
        clock: services.clock,
      }),
    [planningDraftRepository, sessionRepository, services.events, services.clock],
  );
  const createImprovementCandidate = useMemo(
    () =>
      createImprovementCandidateUseCase({
        candidates: planCandidateRepository,
        sessions: sessionRepository,
        events: services.events,
        clock: services.clock,
      }),
    [planCandidateRepository, sessionRepository, services.events, services.clock],
  );
  const promoteCandidateToPlan = useMemo(
    () =>
      createPromoteCandidateToPlanUseCase({
        candidates: planCandidateRepository,
        sessions: sessionRepository,
        events: services.events,
        clock: services.clock,
      }),
    [planCandidateRepository, sessionRepository, services.events, services.clock],
  );
  const generateCapitalRecommendations = useMemo(
    () =>
      createGenerateCapitalRecommendationsUseCase({
        recommendationSets: recommendationSetRepository,
        candidates: planCandidateRepository,
        events: services.events,
        clock: services.clock,
      }),
    [
      recommendationSetRepository,
      planCandidateRepository,
      services.events,
      services.clock,
    ],
  );
  const createCandidateFromRecommendation = useMemo(
    () =>
      createCandidateFromRecommendationUseCase({
        recommendationSets: recommendationSetRepository,
        candidates: planCandidateRepository,
        events: services.events,
        clock: services.clock,
      }),
    [
      recommendationSetRepository,
      planCandidateRepository,
      services.events,
      services.clock,
    ],
  );
  const promoteCandidateToSession = useMemo(
    () =>
      createPromoteCandidateToSessionUseCase({
        candidates: planCandidateRepository,
        sessions: sessionRepository,
        events: services.events,
        clock: services.clock,
      }),
    [planCandidateRepository, sessionRepository, services.events, services.clock],
  );
  const continuePlanUseCase = useMemo(
    () =>
      createContinuePlanUseCase({
        sessions: sessionRepository,
        events: services.events,
        clock: services.clock,
      }),
    [sessionRepository, services.events, services.clock],
  );
  const generateExperimentRecommendations = useMemo(
    () =>
      createGenerateExperimentRecommendationsUseCase({
        recommendationSets: recommendationSetRepository,
        candidates: planCandidateRepository,
        events: services.events,
        clock: services.clock,
      }),
    [
      recommendationSetRepository,
      planCandidateRepository,
      services.events,
      services.clock,
    ],
  );

  const [hydrated, setHydrated] = useState(false);
  const [persisted, setPersisted] = useState<PersistedAppState>(EMPTY_PERSISTED_STATE);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('dashboard');
  const [sessionView, setSessionView] = useState<SessionView>('overview');
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [liveForm, setLiveForm] = useState<PlannerFormValues>(DEFAULT_PLANNER_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PlannerField, string>>>({});
  const [planningView, setPlanningView] = useState<PlanningView>('form');
  const [capitalReviewOpen, setCapitalReviewOpen] = useState(false);
  const [scenarioReviewOpen, setScenarioReviewOpen] = useState(false);
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
  const continuePolicy =
    activePreset !== undefined
      ? activePreset.continuePolicy
      : { maximumRounds: 5000, presets: [1000, 1500, 2000, 5000] };
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
      const restoredSession = findSession(state.sessions, state.activeSessionId);
      if (
        state.planCandidate !== null &&
        isNewSessionCandidate(state.planCandidate)
      ) {
        setActiveWorkspace('capital');
        setCapitalReviewOpen(true);
      } else {
        setActiveWorkspace(hasActive ? 'session' : 'dashboard');
        setCapitalReviewOpen(false);
      }
      if (
        state.planCandidate !== null &&
        state.planCandidate.target === 'append-plan' &&
        state.activeSessionId === state.planCandidate.sessionId
      ) {
        setSessionView('improve-review');
      } else {
        setSessionView(restoredSession?.status === 'playing' ? 'playing' : 'overview');
      }
      setPlanningView(state.planningDraft !== null ? 'decision' : 'form');
      setHydrated(true);
    });
  }, []);

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

  async function handlePromoteDraft(startPlaying: boolean): Promise<void> {
    const result = await promotePlanningDraftUseCase.execute();
    if (!result.ok) {
      showToast('Không có bản nháp kế hoạch');
      return;
    }

    let session = result.session;
    if (startPlaying) {
      session = startCurrentPlan(session);
    }

    const nextState = {
      ...result.nextState,
      sessions: upsertSession(result.nextState.sessions, session),
      activeSessionId: session.id,
    };
    persist(nextState);
    setPlanningView('form');
    setViewingSessionId(null);
    setSessionView(startPlaying ? 'playing' : 'overview');
    setActiveWorkspace('session');
    showToast(startPlaying ? 'Bắt đầu chơi' : 'Session đã tạo từ kế hoạch');
  }

  async function handlePlanningGenerate(values: PlannerFormValues): Promise<void> {
    const result = await generatePlanUseCase.execute({
      formValues: values,
      presetId: persisted.activePresetId,
    });
    if (!result.ok) {
      setFieldErrors(result.fieldErrors);
      return;
    }
    setFieldErrors({});
    setPersisted((prev) => ({ ...prev, planningDraft: result.draft }));
    setPlanningView('decision');
  }

  function renderPlanningWorkspace(): JSX.Element {
    const draft = persisted.planningDraft;
    if (planningView === 'decision' && draft !== null) {
      return (
        <DecisionScreen
          generated={draft.generated}
          onEdit={() => setPlanningView('form')}
          onViewPlan={() => setPlanningView('plan')}
          onStartPlaying={() => {
            void handlePromoteDraft(true);
          }}
        />
      );
    }
    if (planningView === 'plan' && draft !== null) {
      return (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setPlanningView('decision')}>
            ← Kết quả
          </Button>
          <PlanTableScreen
            generated={draft.generated}
            completedThroughRound={0}
            onToggleRound={() => undefined}
            onResetProgress={() => undefined}
            onEdit={() => setPlanningView('form')}
            hideContinue
          />
          <Button size="lg" onClick={() => void handlePromoteDraft(true)}>
            Bắt đầu chơi
          </Button>
        </div>
      );
    }
    return (
      <GeneratePlanScreen
        key={persisted.activePresetId}
        defaultValues={liveForm}
        presets={allPresets}
        activePresetId={persisted.activePresetId}
        onPresetSelect={handlePresetSelect}
        onValuesChange={setLiveForm}
        onSubmit={(values) => {
          void handlePlanningGenerate(values);
        }}
        {...(fieldErrors.request !== undefined ? { serverError: fieldErrors.request } : {})}
      />
    );
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

  function setBetProgress(targetRound: number): void {
    if (persisted.activeSessionId === null) {
      return;
    }
    const session = findSession(persisted.sessions, persisted.activeSessionId);
    if (session === null) {
      return;
    }
    const plan = getCurrentPlan(session);
    const readySession =
      plan !== null && plan.status === 'ready' ? startCurrentPlan(session) : session;
    const updated = setBetProgressOnPlan(readySession, targetRound);
    if (updated === null) {
      return;
    }
    updateSession(persisted.activeSessionId, () => updated);
    const planAfter = getCurrentPlan(updated);
    const at = planAfter?.completedThroughRound ?? targetRound;
    if (at > 0) {
      showToast(`Đã ghi đến vòng ${String(at)}`, 'Hoàn tác', () => undoBet());
    } else {
      showToast('Đã đặt lại tiến độ cược');
    }
  }

  function placeBet(roundIndex: number): void {
    if (persisted.activeSessionId === null) {
      return;
    }
    const session = findSession(persisted.sessions, persisted.activeSessionId);
    if (session === null) {
      return;
    }
    const plan = getCurrentPlan(session);
    const readySession =
      plan !== null && plan.status === 'ready' ? startCurrentPlan(session) : session;
    const updated = placeBetOnPlan(readySession, roundIndex);
    if (updated === null) {
      return;
    }
    updateSession(persisted.activeSessionId, () => updated);
    showToast('Đã lưu cược', 'Hoàn tác', () => undoBet());
  }

  function undoBet(): void {
    if (persisted.activeSessionId === null) {
      return;
    }
    const session = findSession(persisted.sessions, persisted.activeSessionId);
    if (session === null) {
      return;
    }
    const updated = undoBetOnPlan(session);
    if (updated === null) {
      return;
    }
    updateSession(persisted.activeSessionId, () => updated);
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

  async function handleContinue(targetRoundCount: number): Promise<void> {
    if (persisted.activeSessionId === null) {
      return;
    }
    const result = await continuePlanUseCase.execute({
      sessionId: persisted.activeSessionId,
      targetTotalRounds: targetRoundCount,
    });
    if (!result.ok) {
      showToast(result.message ?? 'Không tiếp tục được session');
      return;
    }
    persist({
      ...persisted,
      sessions: upsertSession(persisted.sessions, result.session),
      activeSessionId: result.session.id,
    });
    showToast(`Plan mới đến ${String(targetRoundCount)} vòng`);
    setSessionView('playing');
  }

  async function handleSelectImproveOption(option: ImproveOption): Promise<void> {
    if (persisted.activeSessionId === null) {
      return;
    }
    const result = await createImprovementCandidate.execute({
      sessionId: persisted.activeSessionId,
      option,
    });
    if (!result.ok) {
      showToast('Không tạo được phương án cải thiện');
      return;
    }
    persist({ ...persisted, planCandidate: result.candidate });
    setSessionView('improve-review');
  }

  async function handlePromoteCandidate(): Promise<void> {
    const candidate = persisted.planCandidate;
    if (candidate !== null && isNewSessionCandidate(candidate)) {
      await handlePromoteNewSessionCandidate();
      return;
    }

    const result = await promoteCandidateToPlan.execute();
    if (!result.ok) {
      showToast('Không có phương án để thêm');
      return;
    }
    persist({
      ...persisted,
      planCandidate: null,
      sessions: upsertSession(persisted.sessions, result.session),
      activeSessionId: result.session.id,
    });
    setSessionView(result.session.status === 'playing' ? 'playing' : 'overview');
    showToast('Plan mới đã được thêm vào session');
  }

  async function handleDiscardCandidate(): Promise<void> {
    const candidate = persisted.planCandidate;
    const isCapital =
      candidate !== null &&
      isNewSessionCandidate(candidate) &&
      candidate.source === 'capital';
    const isScenario =
      candidate !== null &&
      isNewSessionCandidate(candidate) &&
      candidate.source === 'scenario';
    await planCandidateRepository.clear();
    persist({ ...persisted, planCandidate: null });
    if (isCapital) {
      setCapitalReviewOpen(false);
      setActiveWorkspace('capital');
    } else if (isScenario) {
      setScenarioReviewOpen(false);
      setActiveWorkspace('scenario');
    } else {
      setSessionView('improve');
    }
    showToast('Đã hủy phương án');
  }

  async function handleUseCapitalRecommendation(recommendationId: string): Promise<void> {
    const result = await createCandidateFromRecommendation.execute({ recommendationId });
    if (!result.ok) {
      showToast('Không chọn được phương án');
      return;
    }
    const updatedSet = await recommendationSetRepository.get();
    persist({
      ...persisted,
      planCandidate: result.candidate,
      recommendationSet: updatedSet ?? persisted.recommendationSet,
    });
    setCapitalReviewOpen(true);
  }

  async function handleGenerateCapital(input: CapitalPlannerInput) {
    const generated = await generateCapitalRecommendations.execute(input);
    if (!generated.ok) {
      return null;
    }
    setCapitalReviewOpen(false);
    setPersisted((prev) => {
      const next: PersistedAppState = {
        ...prev,
        activePresetId: input.presetId,
        planCandidate: null,
        recommendationSet: generated.recommendationSet,
        capitalPlanner: {
          totalBankroll: input.bankroll,
          strategy: input.strategy,
          risk: input.risk,
          presetId: input.presetId,
        },
      };
      if (saveTimer.current !== null) {
        clearTimeout(saveTimer.current);
      }
      saveTimer.current = setTimeout(() => {
        void savePersistedState(next);
      }, 250);
      return next;
    });
    return generated.recommendationSet;
  }

  async function handlePromoteNewSessionCandidate(): Promise<void> {
    let baseState = persisted;
    if (persisted.activeSessionId !== null) {
      const current = findSession(persisted.sessions, persisted.activeSessionId);
      if (current !== null && current.status === 'playing') {
        baseState = {
          ...persisted,
          activeSessionId: null,
          sessions: upsertSession(persisted.sessions, stopSession(current)),
        };
        await sessionRepository.saveState(baseState);
        setPersisted(baseState);
      }
    }

    const result = await promoteCandidateToSession.execute();
    if (!result.ok) {
      showToast('Không tạo được session');
      return;
    }

    const label = baseState.planCandidate?.label ?? 'Session mới';
    persist(result.nextState);
    setCapitalReviewOpen(false);
    setScenarioReviewOpen(false);
    setViewingSessionId(null);
    setSessionView('overview');
    setActiveWorkspace('session');
    showToast(`Session từ ${label} — Plan A sẵn sàng`);
  }

  async function handleUseExperiment(
    selected: Experiment,
    allExperiments: readonly Experiment[],
  ): Promise<void> {
    const generated = await generateExperimentRecommendations.execute({
      experiments: allExperiments,
      presetId: persisted.activePresetId,
    });
    if (!generated.ok) {
      showToast('Không có experiment hợp lệ để tạo khuyến nghị');
      return;
    }

    const result = await createCandidateFromRecommendation.execute({
      recommendationId: selected.id,
    });
    if (!result.ok) {
      showToast('Không chọn được experiment');
      return;
    }

    const updatedSet = await recommendationSetRepository.get();
    persist({
      ...persisted,
      planCandidate: result.candidate,
      recommendationSet: updatedSet ?? generated.recommendationSet,
    });
    setScenarioReviewOpen(true);
  }

  function handleNotesChange(notes: string): void {
    const id = viewingSessionId ?? persisted.activeSessionId;
    if (id === null) {
      return;
    }
    updateSession(id, (s) => updateSessionNotes(s, notes));
  }

  function handleTitleChange(title: string): void {
    const id = viewingSessionId ?? persisted.activeSessionId;
    if (id === null) {
      return;
    }
    updateSession(id, (s) => updateSessionTitle(s, title));
  }

  function renderCapitalWorkspace(): JSX.Element {
    const capitalCandidate =
      persisted.planCandidate !== null &&
      isNewSessionCandidate(persisted.planCandidate) &&
      persisted.planCandidate.source === 'capital'
        ? persisted.planCandidate
        : null;

    if (capitalCandidate !== null && capitalReviewOpen) {
      return (
        <ImproveCandidateReviewScreen
          candidate={capitalCandidate}
          onBack={() => setCapitalReviewOpen(false)}
          onPromote={() => void handlePromoteNewSessionCandidate()}
          onDiscard={() => void handleDiscardCandidate()}
          promoteLabel="Bắt đầu session"
          backLabel="Quay lại khuyến nghị"
          subtitle={`${capitalCandidate.label} — xác nhận trước khi tạo session`}
        />
      );
    }

    return (
      <div className="space-y-4">
        {capitalCandidate !== null ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            <span>Phương án Capital đang chờ xác nhận</span>
            <Button size="sm" variant="outline" onClick={() => setCapitalReviewOpen(true)}>
              Xem lại phương án
            </Button>
          </div>
        ) : null}
        <CapitalPlannerScreen
          presets={allPresets}
          activePresetId={persisted.activePresetId}
          initialBankroll={(
            persisted.recommendationSet?.totalBankroll ??
            persisted.capitalPlanner?.totalBankroll
          )?.toLocaleString('vi-VN') ?? liveForm.userBankroll}
          initialStrategy={
            persisted.recommendationSet?.strategy ??
            persisted.capitalPlanner?.strategy ??
            'balanced'
          }
          initialRisk={
            persisted.recommendationSet?.risk ?? persisted.capitalPlanner?.risk ?? 'normal'
          }
          recommendationSet={persisted.recommendationSet}
          onPresetSelect={handlePresetSelect}
          onGenerate={handleGenerateCapital}
          onUseRecommendation={(id) => void handleUseCapitalRecommendation(id)}
        />
      </div>
    );
  }

  function renderScenarioWorkspace(): JSX.Element {
    const scenarioCandidate =
      persisted.planCandidate !== null &&
      isNewSessionCandidate(persisted.planCandidate) &&
      persisted.planCandidate.source === 'scenario'
        ? persisted.planCandidate
        : null;

    if (scenarioCandidate !== null && scenarioReviewOpen) {
      return (
        <ImproveCandidateReviewScreen
          candidate={scenarioCandidate}
          onBack={() => setScenarioReviewOpen(false)}
          onPromote={() => void handlePromoteNewSessionCandidate()}
          onDiscard={() => void handleDiscardCandidate()}
          promoteLabel="Bắt đầu session"
          backLabel="Quay lại Scenario Planner"
          subtitle={`${scenarioCandidate.label} — xác nhận trước khi tạo session`}
        />
      );
    }

    return (
      <div className="space-y-4">
        {scenarioCandidate !== null ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            <span>Experiment đang chờ xác nhận</span>
            <Button size="sm" variant="outline" onClick={() => setScenarioReviewOpen(true)}>
              Xem lại phương án
            </Button>
          </div>
        ) : null}
        <ScenarioPlannerScreen
          presets={allPresets}
          activePresetId={persisted.activePresetId}
          onPresetSelect={handlePresetSelect}
          onUseExperiment={(experiment, all) => void handleUseExperiment(experiment, all)}
          onPromotePreset={handleSaveGamePreset}
        />
      </div>
    );
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
    const minimalSessionMode = displayedSession.originDraftId !== undefined;
    const isReadOnly =
      readOnlySession ||
      (displayedSession.status !== 'playing' && displayedSession.status !== 'draft');

    return (
      <SessionPlannerScreen
        session={displayedSession}
        preset={preset}
        view={sessionView}
        continuePolicy={continuePolicy}
        planCandidate={persisted.planCandidate}
        onViewChange={setSessionView}
        onStartPlan={isReadOnly ? () => undefined : startPlan}
        onPlaceBet={isReadOnly ? () => undefined : placeBet}
        onSetBetProgress={isReadOnly ? () => undefined : setBetProgress}
        onUndoBet={isReadOnly ? () => undefined : undoBet}
        onWin={isReadOnly ? () => undefined : winAtRound}
        onContinue={isReadOnly ? () => undefined : (target) => void handleContinue(target)}
        onSelectImproveOption={
          isReadOnly ? () => undefined : (option) => void handleSelectImproveOption(option)
        }
        onPromoteCandidate={isReadOnly ? () => undefined : () => void handlePromoteCandidate()}
        onDiscardCandidate={isReadOnly ? () => undefined : () => void handleDiscardCandidate()}
        onNotesChange={handleNotesChange}
        onTitleChange={handleTitleChange}
        onExport={handleExportSession}
        onStopSession={isReadOnly ? () => undefined : handleStopSession}
        readOnly={isReadOnly}
        minimalMode={minimalSessionMode}
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
      case 'scenario':
        return renderScenarioWorkspace();
      case 'capital':
        return renderCapitalWorkspace();
      case 'session':
        return renderSessionWorkspace();
      case 'planning':
        return renderPlanningWorkspace();
      case 'analysis':
        return (
          <InsightsScreen
            sessions={persisted.sessions}
            presets={allPresets}
            capitalPlanner={persisted.capitalPlanner}
            onNavigate={(ws) => setActiveWorkspace(ws)}
            onOpenSession={(id) => {
              setViewingSessionId(id);
              setSessionView('overview');
              setActiveWorkspace('session');
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
            presets={allPresets}
            collections={persisted.libraryCollections}
            onOpenSession={(id) => {
              setViewingSessionId(id);
              setSessionView('overview');
              setActiveWorkspace('session');
            }}
            onToggleFavorite={(id) => {
              updateSession(id, (s) => toggleSessionFavorite(s));
            }}
            onToggleArchive={(id) => {
              updateSession(id, (s) => toggleSessionArchived(s));
            }}
            onDuplicate={(id) => {
              const source = findSession(persisted.sessions, id);
              if (source === null) {
                return;
              }
              const copy = duplicateSession(
                source,
                persisted.nextSessionNumber,
                persisted.sessions,
              );
              persist({
                ...persisted,
                nextSessionNumber: persisted.nextSessionNumber + 1,
                sessions: upsertSession(persisted.sessions, copy),
              });
              setViewingSessionId(copy.id);
              setSessionView('overview');
              setActiveWorkspace('session');
              showToast('Đặt tên session mới');
            }}
            onExportJson={(id) => {
              const session = findSession(persisted.sessions, id);
              if (session !== null) {
                exportFullSessionJson(session);
              }
            }}
            onExportPrint={(id) => {
              const session = findSession(persisted.sessions, id);
              if (session === null) {
                return;
              }
              const preset = findPreset(allPresets, session.presetId);
              exportSessionPrint(session, preset?.name ?? session.presetId);
            }}
            onTagAdd={(id, tag) => {
              updateSession(id, (s) =>
                s.tags.includes(tag) ? s : updateSessionTags(s, [...s.tags, tag]),
              );
            }}
            onAddCollection={(collection: LibraryCollection) => {
              persist({
                ...persisted,
                libraryCollections: [...persisted.libraryCollections, collection],
              });
              showToast(`Collection "${collection.name}" đã thêm`);
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
    (activeWorkspace === 'session' && sessionView === 'playing');

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
    ) : (
      <FormRightPanel form={liveForm} />
    );

  return (
    <ThemeProvider mode={persisted.theme}>
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
    </ThemeProvider>
  );
}
