import { useEffect, useState, type JSX } from 'react';

import { AnalysisScreen } from '@/features/analysis/AnalysisScreen';
import { AllocationScreen } from '@/features/allocation/AllocationScreen';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { HistoryScreen } from '@/features/history/HistoryScreen';
import { GeneratePlanScreen } from '@/features/planner/GeneratePlanScreen';
import { PlanReadyScreen } from '@/features/planner/PlanReadyScreen';
import { PlanTableScreen } from '@/features/planner/PlanTableScreen';
import {
  DEFAULT_PLANNER_FORM,
  generatePlan,
  type GenerateResult,
  type PlannerFormValues,
  type PlannerField,
} from '@/features/planner/plan-service';
import { FormRightPanel, PlanRightPanel, PlayingProgressPanel } from '@/features/planner/RightPanel';
import type { WorkspaceId } from '@/features/navigation/workspace-nav';
import type { PlanRecord } from '@/features/session/plan-records';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { AppLayout } from '@/layout/AppLayout';
import { ComingSoonToast } from '@/components/ui/coming-soon-toast';

type PlanningPhase = 'form' | 'ready';

export function App(): JSX.Element {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('dashboard');
  const [planningPhase, setPlanningPhase] = useState<PlanningPhase>('form');
  const [formValues, setFormValues] = useState<PlannerFormValues>(DEFAULT_PLANNER_FORM);
  const [liveForm, setLiveForm] = useState<PlannerFormValues>(DEFAULT_PLANNER_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PlannerField, string>>>({});
  const [generated, setGenerated] = useState<GenerateResult | null>(null);
  const [completedThroughRound, setCompletedThroughRound] = useState(0);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [recentPlans, setRecentPlans] = useState<PlanRecord[]>([]);
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeWorkspace, planningPhase]);

  function handleGenerate(values: PlannerFormValues): void {
    setFormValues(values);
    const outcome = generatePlan(values);
    if (outcome.fieldErrors !== undefined) {
      setFieldErrors(outcome.fieldErrors);
      return;
    }
    if (outcome.result === undefined) {
      return;
    }
    setFieldErrors({});
    setCompletedThroughRound(0);
    setSessionStarted(false);
    setGenerated(outcome.result);
    const id = Date.now();
    const record: PlanRecord = {
      id,
      label: `Kế hoạch ${values.roundCount} vòng`,
      roundCount: Number(values.roundCount),
      status: 'ready',
      createdAt: new Date(),
    };
    setActivePlanId(id);
    setRecentPlans((prev) => [record, ...prev].slice(0, 8));
    setSessionNumber((n) => (generated === null ? 1 : n + 1));
    setPlanningPhase('ready');
    setActiveWorkspace('planning');
  }

  function startSession(): void {
    setSessionStarted(true);
    setRecentPlans((prev) =>
      prev.map((p) => (p.id === activePlanId ? { ...p, status: 'playing' as const } : p)),
    );
    setActiveWorkspace('playing');
  }

  function renderPlanning(): JSX.Element {
    if (planningPhase === 'ready' && generated !== null) {
      return (
        <PlanReadyScreen
          generated={generated}
          onEdit={() => setPlanningPhase('form')}
          onStart={startSession}
          onViewTable={() => {
            setSessionStarted(true);
            setActiveWorkspace('playing');
          }}
          onSimulate={() => setActiveWorkspace('analysis')}
          onExport={() => setToast('Xuất file — sắp có trong Settings.')}
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

  function renderMain(): JSX.Element {
    switch (activeWorkspace) {
      case 'dashboard':
        return (
          <DashboardScreen
            generated={generated}
            sessionNumber={sessionNumber}
            sessionStarted={sessionStarted}
            completedThroughRound={completedThroughRound}
            recentPlans={recentPlans}
            onContinueSession={() => setActiveWorkspace('playing')}
            onNewPlan={() => {
              setPlanningPhase('form');
              setActiveWorkspace('planning');
            }}
            onOpenPlan={() => {
              if (generated !== null) {
                setActiveWorkspace(sessionStarted ? 'playing' : 'planning');
                if (!sessionStarted) {
                  setPlanningPhase('ready');
                }
              }
            }}
          />
        );
      case 'planning':
        return renderPlanning();
      case 'playing':
        return generated !== null ? (
          <PlanTableScreen
            generated={generated}
            sessionNumber={sessionNumber}
            completedThroughRound={completedThroughRound}
            onToggleRound={(roundIndex, checked) =>
              setCompletedThroughRound(checked ? roundIndex : roundIndex - 1)
            }
            onResetProgress={() => setCompletedThroughRound(0)}
            onEdit={() => {
              setPlanningPhase('form');
              setActiveWorkspace('planning');
            }}
          />
        ) : (
          renderPlanning()
        );
      case 'analysis':
        return <AnalysisScreen />;
      case 'allocation':
        return <AllocationScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'settings':
        return <SettingsScreen theme={theme} onThemeChange={(dark) => setTheme(dark ? 'dark' : 'light')} />;
      default:
        return renderPlanning();
    }
  }

  const showRightPanel =
    activeWorkspace === 'planning' ||
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
      <FormRightPanel form={formValues} />
    );

  return (
    <>
      <AppLayout
        activeWorkspace={activeWorkspace}
        onWorkspaceSelect={setActiveWorkspace}
        theme={theme}
        onThemeChange={(dark) => setTheme(dark ? 'dark' : 'light')}
        showRightPanel={showRightPanel}
        main={renderMain()}
        rightPanel={rightPanel}
      />
      {toast !== null ? <ComingSoonToast message={toast} onClose={() => setToast(null)} /> : null}
    </>
  );
}
