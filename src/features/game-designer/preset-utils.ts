import { BUILTIN_GAME_PRESETS } from '@/features/game-designer/builtin-presets';
import type { GamePolicyDraft, GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { normalizeContinuePolicy } from '@/features/continue/continue-policy-utils';
import type { PlannerFormValues } from '@/features/planner/plan-service';

export function mergePresets(custom: readonly GamePolicyPreset[]): GamePolicyPreset[] {
  const overridden = new Set(custom.map((c) => c.id));
  const builtins = BUILTIN_GAME_PRESETS.filter((b) => !overridden.has(b.id));
  return [...builtins, ...custom].map((preset) => ({
    ...preset,
    continuePolicy: normalizeContinuePolicy(preset.continuePolicy),
  }));
}

export function findPreset(
  presets: readonly GamePolicyPreset[],
  id: string,
): GamePolicyPreset | undefined {
  return presets.find((p) => p.id === id);
}

export function presetToPlannerPatch(preset: GamePolicyPreset): Partial<PlannerFormValues> {
  const tax = preset.rewardPolicy.type === 'tier-tax';
  return {
    presetId: preset.id,
    rewardMultiplier: preset.rewardMultiplier,
    minimumBet: preset.minimumBet,
    maximumBet: preset.maximumBet,
    betStep: preset.betStep,
    winTaxEnabled: tax,
    winTaxThreshold: tax ? (preset.rewardPolicy.threshold ?? '10.000.000') : '',
    winTaxRatePercent: tax ? (preset.rewardPolicy.ratePercent ?? '10') : '10',
  };
}

export function applyPresetToForm(
  form: PlannerFormValues,
  preset: GamePolicyPreset,
): PlannerFormValues {
  return { ...form, ...presetToPlannerPatch(preset) };
}

export function draftFromPreset(preset: GamePolicyPreset): GamePolicyDraft {
  return {
    name: preset.name,
    category: preset.category,
    rewardMultiplier: preset.rewardMultiplier,
    minimumBet: preset.minimumBet,
    maximumBet: preset.maximumBet,
    betStep: preset.betStep,
    rewardPolicy: preset.rewardPolicy,
    continuePolicy: normalizeContinuePolicy(preset.continuePolicy),
  };
}

export function presetFromDraft(
  draft: GamePolicyDraft,
  id: string,
  options?: { builtin?: boolean },
): GamePolicyPreset {
  return {
    id,
    name: draft.name.trim() || 'My Preset',
    category: draft.category.trim() || 'Custom',
    rewardMultiplier: draft.rewardMultiplier,
    minimumBet: draft.minimumBet,
    maximumBet: draft.maximumBet,
    betStep: draft.betStep,
    rewardPolicy: draft.rewardPolicy,
    continuePolicy: normalizeContinuePolicy(draft.continuePolicy),
    createdAt: new Date().toISOString(),
    ...(options?.builtin === true ? { builtin: true } : {}),
  };
}

export function rewardPolicyLabel(policy: GamePolicyPreset['rewardPolicy']): string {
  if (policy.type === 'no-tax') {
    return 'No tax';
  }
  return `Tax ${policy.ratePercent ?? '?'}%`;
}
