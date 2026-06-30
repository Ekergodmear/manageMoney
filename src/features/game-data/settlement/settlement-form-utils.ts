import type { RewardPolicyConfig } from '@/features/game-designer/game-policy-types';
import type { PlannerFormValues } from '@/features/planner/plan-service';
import type { WinTax } from '@/application/dto';

function parsePositiveInt(raw: string): number | null {
  const normalized = raw.trim().replace(/,/g, '').replace(/\s/g, '');
  if (normalized === '') {
    return null;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 1) {
    return null;
  }
  return value;
}

export function winTaxFromRewardPolicy(policy: RewardPolicyConfig): WinTax | undefined {
  if (policy.type !== 'tier-tax') {
    return undefined;
  }
  const threshold = policy.threshold !== undefined ? parsePositiveInt(policy.threshold) : null;
  const ratePercent =
    policy.ratePercent !== undefined ? parsePositiveInt(policy.ratePercent) : null;
  if (threshold === null || ratePercent === null || ratePercent < 1 || ratePercent > 99) {
    return undefined;
  }
  return { threshold, ratePercent };
}

export function winTaxFromFormValues(form: PlannerFormValues): WinTax | undefined {
  if (!form.winTaxEnabled) {
    return undefined;
  }
  const threshold = parsePositiveInt(form.winTaxThreshold);
  const ratePercent = parsePositiveInt(form.winTaxRatePercent);
  if (threshold === null || ratePercent === null || ratePercent < 1 || ratePercent > 99) {
    return undefined;
  }
  return { threshold, ratePercent };
}

export function rewardMultiplierFromForm(form: PlannerFormValues): number {
  const normalized = form.rewardMultiplier.trim().replace(/,/g, '').replace(/\s/g, '');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 1;
}
