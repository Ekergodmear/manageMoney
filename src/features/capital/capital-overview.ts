import type { CapitalOverview } from '@/features/capital/capital-planner-types';
import { getCurrentPlan, type Session } from '@/features/session/session-domain';
import type { PersistedAppState } from '@/features/session/session-types';
import { parseMoneyPositiveInt } from '@/lib/money-format';

export function computeCapitalOverview(state: PersistedAppState): CapitalOverview {
  const fromPlanner = state.capitalPlanner?.totalBankroll ?? 0;

  let fromActive = 0;
  const active = state.activeSessionId
    ? state.sessions.find((s) => s.id === state.activeSessionId)
    : null;
  if (active !== null && active !== undefined) {
    const plan = getCurrentPlan(active);
    const parsed = parseMoneyPositiveInt(plan?.formValues.userBankroll ?? '');
    if (parsed !== null) {
      fromActive = parsed;
    }
  }

  const total = fromPlanner > 0 ? fromPlanner : fromActive;

  let allocated = 0;
  for (const session of state.sessions) {
    if (session.status !== 'playing' && session.status !== 'draft') {
      continue;
    }
    const plan = getCurrentPlan(session);
    if (plan !== null) {
      allocated += plan.generated.statistics.requiredBankrollAmount;
    }
  }

  return {
    total,
    allocated,
    available: Math.max(0, total - allocated),
  };
}

export function allocatedCapitalForSession(session: Session): number {
  const plan = getCurrentPlan(session);
  return plan?.generated.statistics.requiredBankrollAmount ?? 0;
}
