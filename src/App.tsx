import { useEffect, useState, type JSX } from 'react';

import { DecisionScreen } from '@/features/planner/DecisionScreen';
import { GeneratePlanScreen } from '@/features/planner/GeneratePlanScreen';
import { PlanTableScreen } from '@/features/planner/PlanTableScreen';
import {
  DEFAULT_PLANNER_FORM,
  generatePlan,
  type GenerateResult,
  type PlannerFormValues,
  type PlannerField,
} from '@/features/planner/plan-service';
import { FormRightPanel, ResultRightPanel } from '@/features/planner/RightPanel';
import { AppLayout, type NavItemId } from '@/layout/AppLayout';
import { ComingSoonToast } from '@/components/ui/coming-soon-toast';

type Screen = 'form' | 'decision' | 'plan';

export function App(): JSX.Element {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [screen, setScreen] = useState<Screen>('form');
  const [formValues, setFormValues] = useState<PlannerFormValues>(DEFAULT_PLANNER_FORM);
  const [liveForm, setLiveForm] = useState<PlannerFormValues>(DEFAULT_PLANNER_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PlannerField, string>>>({});
  const [generated, setGenerated] = useState<GenerateResult | null>(null);
  const [completedThroughRound, setCompletedThroughRound] = useState(0);
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen]);

  function handleNavSelect(id: NavItemId): void {
    if (id !== 'create') {
      setComingSoon('Tính năng đang phát triển — sẽ có trong bản cập nhật tới.');
      return;
    }
    setScreen('form');
  }

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
    setGenerated(outcome.result);
    setScreen('decision');
  }

  const main =
    screen === 'decision' && generated !== null ? (
      <DecisionScreen
        generated={generated}
        onEdit={() => setScreen('form')}
        onViewPlan={() => setScreen('plan')}
      />
    ) : screen === 'plan' && generated !== null ? (
      <PlanTableScreen
        generated={generated}
        completedThroughRound={completedThroughRound}
        onToggleRound={(roundIndex, checked) =>
          setCompletedThroughRound(checked ? roundIndex : roundIndex - 1)
        }
        onResetProgress={() => setCompletedThroughRound(0)}
        onBackToDecision={() => setScreen('decision')}
        onEdit={() => setScreen('form')}
      />
    ) : (
      <GeneratePlanScreen
        defaultValues={formValues}
        onValuesChange={setLiveForm}
        onSubmit={handleGenerate}
        {...(fieldErrors.request !== undefined ? { serverError: fieldErrors.request } : {})}
      />
    );

  const rightPanel =
    screen === 'form' ? (
      <FormRightPanel form={liveForm} />
    ) : generated !== null ? (
      <ResultRightPanel generated={generated} completedThroughRound={completedThroughRound} />
    ) : (
      <FormRightPanel form={formValues} />
    );

  return (
    <>
      <AppLayout
        activeNav="create"
        onNavSelect={handleNavSelect}
        theme={theme}
        onThemeChange={(dark) => setTheme(dark ? 'dark' : 'light')}
        main={main}
        rightPanel={rightPanel}
      />
      {comingSoon !== null ? (
        <ComingSoonToast message={comingSoon} onClose={() => setComingSoon(null)} />
      ) : null}
    </>
  );
}
