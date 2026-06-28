import { generatePlan, type GenerateResult, type PlannerFormValues } from '@/features/planner/plan-service';

import type { ScenarioExperiment, ScenarioLabSnapshot } from '@/features/scenario/scenario-types';

export function applyFormOverrides(
  base: PlannerFormValues,
  overrides: Partial<PlannerFormValues>,
): PlannerFormValues {
  return { ...base, ...overrides };
}

export function runScenarioForm(form: PlannerFormValues): {
  readonly result: GenerateResult | null;
  readonly error: string | null;
} {
  const outcome = generatePlan(form);
  if (outcome.fieldErrors !== undefined) {
    const first = Object.values(outcome.fieldErrors).find((m) => m !== undefined && m !== '');
    return { result: null, error: first ?? 'Giá trị không hợp lệ.' };
  }
  if (outcome.result === undefined) {
    return { result: null, error: 'Không tạo được kế hoạch.' };
  }
  return { result: outcome.result, error: null };
}

export function describeOverrides(overrides: Partial<PlannerFormValues>): string {
  const parts: string[] = [];
  if (overrides.rewardMultiplier !== undefined) {
    parts.push(`×${overrides.rewardMultiplier}`);
  }
  if (overrides.winTaxRatePercent !== undefined && overrides.winTaxEnabled !== false) {
    parts.push(`Tax ${overrides.winTaxRatePercent}%`);
  }
  if (overrides.winTaxEnabled === false) {
    parts.push('No tax');
  }
  if (overrides.maximumBet !== undefined) {
    parts.push(`Max ${overrides.maximumBet}`);
  }
  if (overrides.userBankroll !== undefined) {
    parts.push(`Vốn ${overrides.userBankroll}`);
  }
  if (overrides.roundCount !== undefined) {
    parts.push(`${overrides.roundCount} vòng`);
  }
  if (overrides.targetProfit !== undefined) {
    parts.push(`Profit ${overrides.targetProfit}`);
  }
  if (overrides.minimumBet !== undefined) {
    parts.push(`Min ${overrides.minimumBet}`);
  }
  if (overrides.betStep !== undefined) {
    parts.push(`Step ${overrides.betStep}`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'Biến thể';
}

function nextExperimentName(nonBaselineCount: number): string {
  const letter = String.fromCharCode(65 + nonBaselineCount);
  return `Experiment ${letter}`;
}

export function createBaselineExperiment(
  form: PlannerFormValues,
  presetId: string,
): ScenarioExperiment {
  const { result, error } = runScenarioForm(form);
  return {
    id: crypto.randomUUID(),
    name: 'Baseline',
    label: `Baseline · ${presetId}`,
    isBaseline: true,
    overrides: {},
    formValues: { ...form, presetId },
    result,
    error,
    notes: '',
  };
}

export function forkExperiment(
  baselineForm: PlannerFormValues,
  existing: readonly ScenarioExperiment[],
  overrides: Partial<PlannerFormValues>,
  label?: string,
): ScenarioExperiment {
  const formValues = applyFormOverrides(baselineForm, overrides);
  const { result, error } = runScenarioForm(formValues);
  const experimentLabel = label ?? describeOverrides(overrides);
  return {
    id: crypto.randomUUID(),
    name: nextExperimentName(existing.filter((e) => !e.isBaseline).length),
    label: experimentLabel,
    isBaseline: false,
    overrides,
    formValues,
    result,
    error,
    notes: '',
  };
}

export function duplicateExperiment(
  source: ScenarioExperiment,
  existing: readonly ScenarioExperiment[],
): ScenarioExperiment {
  return {
    id: crypto.randomUUID(),
    name: nextExperimentName(existing.filter((e) => !e.isBaseline).length),
    label: `${source.label} (bản sao)`,
    isBaseline: false,
    overrides: { ...source.overrides },
    formValues: { ...source.formValues },
    result: source.result,
    error: source.error,
    notes: source.notes,
  };
}

export function regenerateExperiment(experiment: ScenarioExperiment): ScenarioExperiment {
  const { result, error } = runScenarioForm(experiment.formValues);
  return { ...experiment, result, error };
}

export function updateExperimentForm(
  experiment: ScenarioExperiment,
  baselineForm: PlannerFormValues,
  formValues: PlannerFormValues,
): ScenarioExperiment {
  const overrides: Partial<PlannerFormValues> = {};
  for (const key of Object.keys(formValues) as (keyof PlannerFormValues)[]) {
    if (formValues[key] !== baselineForm[key]) {
      (overrides as Record<string, unknown>)[key] = formValues[key];
    }
  }
  const { result, error } = runScenarioForm(formValues);
  return {
    ...experiment,
    overrides,
    formValues,
    label: experiment.isBaseline ? experiment.label : describeOverrides(overrides),
    result,
    error,
  };
}

export function updateExperimentNotes(
  experiment: ScenarioExperiment,
  notes: string,
): ScenarioExperiment {
  return { ...experiment, notes };
}

export function restoreLabFromSnapshot(snapshot: ScenarioLabSnapshot & { branches?: ScenarioLabSnapshot['experiments'] }): {
  baseline: ScenarioExperiment;
  experiments: ScenarioExperiment[];
} {
  const baseline = createBaselineExperiment(snapshot.baselineForm, snapshot.presetId);
  const experiments: ScenarioExperiment[] = [baseline];
  const items = snapshot.experiments ?? snapshot.branches ?? [];
  for (const item of items) {
    if (item.isBaseline) {
      continue;
    }
    const forked = forkExperiment(snapshot.baselineForm, experiments, item.overrides, item.label);
    experiments.push({
      ...forked,
      notes: item.notes ?? '',
    });
  }
  return { baseline, experiments };
}

/** @deprecated Use createBaselineExperiment */
export const createBaselineBranch = createBaselineExperiment;
/** @deprecated Use forkExperiment */
export const forkScenarioBranch = forkExperiment;
/** @deprecated Use regenerateExperiment */
export const regenerateBranch = regenerateExperiment;
/** @deprecated Use updateExperimentForm */
export const updateBranchForm = updateExperimentForm;
