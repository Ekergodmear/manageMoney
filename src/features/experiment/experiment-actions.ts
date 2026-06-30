import { normalizeContinuePolicy } from '@/features/continue/continue-policy-utils';
import type { GamePolicyDraft, GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { presetFromDraft } from '@/features/game-designer/preset-utils';
import type { PlannerFormValues } from '@/features/planner/plan-service';

import type { Experiment, ExperimentLabSnapshot } from '@/features/experiment/experiment-types';

const RECENT_KEY = 'stake-planner-recent-scenarios';
const MAX_RECENT = 5;

interface StoredRecentScenario extends Omit<ExperimentLabSnapshot, 'experiments'> {
  readonly experiments?: ExperimentLabSnapshot['experiments'];
  readonly branches?: ExperimentLabSnapshot['experiments'];
}

export function formToGamePolicyDraft(form: PlannerFormValues, name: string): GamePolicyDraft {
  const tax = form.winTaxEnabled;
  return {
    name,
    category: 'Scenario',
    rewardMultiplier: form.rewardMultiplier,
    minimumBet: form.minimumBet,
    maximumBet: form.maximumBet,
    betStep: form.betStep,
    rewardPolicy: tax
      ? {
          type: 'tier-tax',
          threshold: form.winTaxThreshold,
          ratePercent: form.winTaxRatePercent,
        }
      : { type: 'no-tax' },
    continuePolicy: normalizeContinuePolicy({ maximumRounds: 5000 }),
  };
}

export function promoteExperimentToPreset(
  experiment: Experiment,
  presetName: string,
): GamePolicyPreset {
  const draft = formToGamePolicyDraft(experiment.formValues, presetName);
  return presetFromDraft(draft, `scenario-${crypto.randomUUID().slice(0, 8)}`);
}

/** @deprecated Use promoteExperimentToPreset */
export const promoteBranchToPreset = promoteExperimentToPreset;

export function labToSnapshot(lab: {
  id: string;
  name: string;
  presetId: string;
  baseline: Experiment | null;
  experiments: readonly Experiment[];
  createdAt: string;
}): ExperimentLabSnapshot | null {
  if (lab.baseline === null) {
    return null;
  }
  return {
    id: lab.id,
    name: lab.name,
    savedAt: new Date().toISOString(),
    presetId: lab.presetId,
    baselineForm: lab.baseline.formValues,
    experiments: lab.experiments.map((e) => ({
      name: e.name,
      label: e.label,
      isBaseline: e.isBaseline,
      overrides: e.overrides,
      notes: e.notes,
    })),
  };
}

export function loadRecentScenarios(): ExperimentLabSnapshot[] {
  try {
    const raw = sessionStorage.getItem(RECENT_KEY);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw) as StoredRecentScenario[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((item) => ({
      ...item,
      experiments: item.experiments ?? item.branches ?? [],
    }));
  } catch {
    return [];
  }
}

export function saveRecentScenario(snapshot: ExperimentLabSnapshot): ExperimentLabSnapshot[] {
  const existing = loadRecentScenarios().filter((s) => s.id !== snapshot.id);
  const next = [snapshot, ...existing].slice(0, MAX_RECENT);
  try {
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private mode
  }
  return next;
}

export function removeRecentScenario(id: string): ExperimentLabSnapshot[] {
  const next = loadRecentScenarios().filter((s) => s.id !== id);
  try {
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private mode
  }
  return next;
}
