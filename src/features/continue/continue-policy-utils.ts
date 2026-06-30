import type { ContinuePolicyConfig } from '@/features/game-designer/game-policy-types';

export const DEFAULT_CONTINUE_PRESETS: readonly number[] = [1000, 1500, 2000, 5000];

export function normalizeContinuePolicy(
  policy: Partial<ContinuePolicyConfig> | undefined,
): ContinuePolicyConfig {
  const maximumRounds = policy?.maximumRounds ?? 5000;
  const rawPresets =
    policy?.presets !== undefined && policy.presets.length > 0
      ? policy.presets
      : DEFAULT_CONTINUE_PRESETS;
  const presets = [...new Set(rawPresets)]
    .filter((n) => Number.isFinite(n) && n > 0 && n <= maximumRounds)
    .sort((a, b) => a - b);
  return {
    maximumRounds,
    presets: presets.length > 0 ? presets : [maximumRounds],
  };
}

/** Preset targets lớn hơn vòng hiện tại và không vượt maximumRounds. */
export function continueTargetsForPlan(
  policy: ContinuePolicyConfig,
  currentTotalRounds: number,
): number[] {
  const normalized = normalizeContinuePolicy(policy);
  return normalized.presets.filter((n) => n > currentTotalRounds && n <= normalized.maximumRounds);
}
