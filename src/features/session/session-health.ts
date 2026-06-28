import { accumulatedAtRound } from '@/features/planner/plan-display';
import type { Plan } from '@/features/session/session-domain';
import { parseMoneyPositiveInt } from '@/lib/money-format';

export type SessionHealth = 'safe' | 'tight' | 'risky';

export function computeSessionHealth(plan: Plan): SessionHealth {
  const required = plan.generated.statistics.requiredBankrollAmount;
  const bankroll = parseMoneyPositiveInt(plan.formValues.userBankroll);
  if (bankroll === null || bankroll <= 0) {
    return 'tight';
  }
  const ratio = required / bankroll;
  if (ratio <= 0.75) {
    return 'safe';
  }
  if (ratio <= 0.95) {
    return 'tight';
  }
  return 'risky';
}

export function computeCapitalUsagePercent(plan: Plan): number | null {
  const bankroll = parseMoneyPositiveInt(plan.formValues.userBankroll);
  if (bankroll === null || bankroll <= 0) {
    return null;
  }
  const spent = accumulatedAtRound(
    plan.generated.strategy.rounds,
    plan.completedThroughRound,
  );
  return Math.min(100, Math.round((spent / bankroll) * 100));
}

export function computeCapitalEfficiencyPercent(plan: Plan): number | null {
  const required = plan.generated.statistics.requiredBankrollAmount;
  if (required <= 0) {
    return null;
  }
  const target = plan.generated.statistics.expectedProfitAmount;
  return Math.round((target / required) * 1000) / 10;
}

export const HEALTH_LABELS: Record<SessionHealth, string> = {
  safe: 'An toàn',
  tight: 'Vừa phải',
  risky: 'Rủi ro',
};

export const HEALTH_EMOJI: Record<SessionHealth, string> = {
  safe: '🟢',
  tight: '🟡',
  risky: '🔴',
};
