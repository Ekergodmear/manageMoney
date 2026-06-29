import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { accumulatedAtRound } from '@/features/planner/plan-display';
import type { GenerateResult, PlannerFormValues } from '@/features/planner/plan-service';

export type PlanOrigin = 'generate' | 'improve' | 'continue' | 'capital' | 'scenario';

export type PlanStatus = 'ready' | 'playing' | 'won' | 'lost' | 'superseded';

export type SessionStatus = 'draft' | 'playing' | 'won' | 'lost' | 'stopped';

export type SessionTimelineEventType =
  | 'session-created'
  | 'plan-added'
  | 'plan-started'
  | 'bet'
  | 'undo'
  | 'plan-lost'
  | 'plan-won'
  | 'session-won'
  | 'session-stopped'
  | 'improve'
  | 'continue'
  | 'note-updated';

export interface SessionTimelineEvent {
  readonly at: string;
  readonly type: SessionTimelineEventType;
  readonly planId?: string;
  readonly label?: string;
  readonly origin?: PlanOrigin;
  readonly roundIndex?: number;
  readonly betAmount?: number;
}

export interface Plan {
  readonly id: string;
  readonly label: string;
  readonly origin: PlanOrigin;
  readonly parentPlanId: string | null;
  readonly formValues: PlannerFormValues;
  readonly generated: GenerateResult;
  readonly status: PlanStatus;
  readonly completedThroughRound: number;
  readonly createdAt: string;
  readonly finishedAt?: string;
}

export interface SessionStatistics {
  readonly roundsPlayed: number;
  readonly planCount: number;
  readonly improveCount: number;
  readonly continueCount: number;
  readonly highestBet: number;
  readonly totalCapital: number;
}

export interface Session {
  readonly id: string;
  readonly sessionNumber: number;
  readonly title: string;
  readonly presetId: string;
  readonly status: SessionStatus;
  readonly plans: readonly Plan[];
  readonly currentPlanId: string | null;
  readonly timeline: readonly SessionTimelineEvent[];
  readonly notes: string;
  readonly startedAt: string | null;
  readonly finishedAt?: string;
  readonly profitAmount: number | null;
  readonly favorite: boolean;
  readonly archived: boolean;
  readonly tags: readonly string[];
  readonly pendingRename?: boolean;
  readonly originDraftId?: string;
  readonly originRecommendationId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function addEvent(
  timeline: readonly SessionTimelineEvent[],
  event: Omit<SessionTimelineEvent, 'at'>,
): SessionTimelineEvent[] {
  return [...timeline, { ...event, at: nowIso() }];
}

export function findPlan(session: Session, planId: string): Plan | undefined {
  return session.plans.find((p) => p.id === planId);
}

export function getCurrentPlan(session: Session): Plan | null {
  if (session.currentPlanId === null) {
    return null;
  }
  return findPlan(session, session.currentPlanId) ?? null;
}

export function computeSessionStatistics(session: Session): SessionStatistics {
  let roundsPlayed = 0;
  let improveCount = 0;
  let continueCount = 0;
  let highestBet = 0;
  let totalCapital = 0;

  for (const plan of session.plans) {
    if (plan.origin === 'improve') {
      improveCount++;
    }
    if (plan.origin === 'continue') {
      continueCount++;
    }
    roundsPlayed += plan.completedThroughRound;
    totalCapital += accumulatedAtRound(plan.generated.strategy.rounds, plan.completedThroughRound);
    const maxBet = plan.generated.statistics.maximumBetAmount;
    if (maxBet > highestBet) {
      highestBet = maxBet;
    }
  }

  return {
    roundsPlayed,
    planCount: session.plans.length,
    improveCount,
    continueCount,
    highestBet,
    totalCapital,
  };
}

export function startCurrentPlan(session: Session): Session {
  const plan = getCurrentPlan(session);
  if (plan === null) {
    return session;
  }
  const at = nowIso();
  return {
    ...session,
    status: 'playing',
    startedAt: session.startedAt ?? at,
    plans: session.plans.map((p) =>
      p.id === plan.id ? { ...p, status: 'playing' as const } : p,
    ),
    timeline: addEvent(session.timeline, {
      type: 'plan-started',
      planId: plan.id,
      label: plan.label,
    }),
    updatedAt: at,
  };
}

export function placeBetOnPlan(session: Session, roundIndex: number): Session | null {
  const plan = getCurrentPlan(session);
  if (plan === null || plan.status !== 'playing') {
    return null;
  }
  if (roundIndex !== plan.completedThroughRound + 1) {
    return null;
  }
  return setBetProgressOnPlan(session, roundIndex);
}

/** Ghi tiến độ hàng loạt — tick vòng N = đã cược đến vòng N. */
export function setBetProgressOnPlan(session: Session, targetRound: number): Session | null {
  const plan = getCurrentPlan(session);
  if (plan === null || plan.status !== 'playing') {
    return null;
  }
  const totalRounds = plan.generated.strategy.rounds.length;
  if (targetRound < 0 || targetRound > totalRounds) {
    return null;
  }
  if (targetRound === plan.completedThroughRound) {
    return null;
  }

  const updatedPlan: Plan = {
    ...plan,
    completedThroughRound: targetRound,
  };
  const lastRound =
    targetRound > 0 ? plan.generated.strategy.rounds[targetRound - 1] : undefined;
  const advancing = targetRound > plan.completedThroughRound;

  return {
    ...session,
    plans: session.plans.map((p) => (p.id === plan.id ? updatedPlan : p)),
    timeline: addEvent(session.timeline, {
      type: advancing ? 'bet' : 'undo',
      planId: plan.id,
      roundIndex: targetRound > 0 ? targetRound : plan.completedThroughRound,
      betAmount: lastRound?.betAmount,
      label: advancing
        ? `Đến vòng ${String(targetRound)}`
        : `Về vòng ${String(targetRound)}`,
    }),
    updatedAt: nowIso(),
  };
}

export function undoBetOnPlan(session: Session): Session | null {
  const plan = getCurrentPlan(session);
  if (plan === null || plan.completedThroughRound <= 0) {
    return null;
  }
  return setBetProgressOnPlan(session, plan.completedThroughRound - 1);
}

function markPlanFinished(plan: Plan, status: 'won' | 'lost'): Plan {
  return {
    ...plan,
    status,
    finishedAt: nowIso(),
  };
}

export function winCurrentPlan(session: Session, roundIndex: number, profit: number | null): Session {
  const plan = getCurrentPlan(session);
  if (plan === null) {
    return session;
  }
  const completed = Math.max(plan.completedThroughRound, roundIndex);
  const finished = markPlanFinished(
    { ...plan, completedThroughRound: completed },
    'won',
  );
  return {
    ...session,
    status: 'won',
    profitAmount: profit,
    finishedAt: nowIso(),
    plans: session.plans.map((p) => (p.id === plan.id ? finished : p)),
    timeline: addEvent(session.timeline, {
      type: 'session-won',
      planId: plan.id,
      roundIndex,
      label: 'Won',
    }),
    updatedAt: nowIso(),
  };
}

export function markCurrentPlanLost(session: Session): Session {
  const plan = getCurrentPlan(session);
  if (plan === null) {
    return session;
  }
  const finished = markPlanFinished(plan, 'lost');
  return {
    ...session,
    plans: session.plans.map((p) => (p.id === plan.id ? finished : p)),
    timeline: addEvent(session.timeline, {
      type: 'plan-lost',
      planId: plan.id,
      label: plan.label,
    }),
    updatedAt: nowIso(),
  };
}

export function updateSessionNotes(session: Session, notes: string): Session {
  if (session.notes === notes) {
    return session;
  }
  return {
    ...session,
    notes,
    updatedAt: nowIso(),
  };
}

export function updateSessionTitle(session: Session, title: string): Session {
  const trimmed = title.trim();
  if (trimmed === '' || trimmed === session.title) {
    return { ...session, pendingRename: false, updatedAt: nowIso() };
  }
  return {
    ...session,
    title: trimmed,
    pendingRename: false,
    updatedAt: nowIso(),
  };
}

export function stopSession(session: Session): Session {
  return {
    ...session,
    status: 'stopped',
    finishedAt: nowIso(),
    timeline: addEvent(session.timeline, { type: 'session-stopped', label: 'Stopped' }),
    updatedAt: nowIso(),
  };
}

export function formatSessionTime(iso: string | null): string {
  if (iso === null) {
    return '—';
  }
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function planOriginLabel(origin: PlanOrigin): string {
  switch (origin) {
    case 'generate':
      return 'Generate';
    case 'improve':
      return 'Cải thiện';
    case 'continue':
      return 'Continue';
    case 'capital':
      return 'Capital';
    case 'scenario':
      return 'Scenario';
  }
}

export function planStatusBadge(
  plan: Plan,
  isCurrent: boolean,
): { readonly text: string; readonly variant: 'default' | 'outline' | 'secondary' | 'destructive' } {
  if (isCurrent && (plan.status === 'playing' || plan.status === 'ready')) {
    return { text: 'Hiện tại', variant: 'default' };
  }
  switch (plan.status) {
    case 'won':
      return { text: '✓ Thắng', variant: 'outline' };
    case 'lost':
      return { text: 'Thua', variant: 'destructive' };
    case 'superseded':
      return { text: 'Thay thế', variant: 'secondary' };
    case 'ready':
      return { text: 'Sẵn sàng', variant: 'outline' };
    case 'playing':
      return { text: 'Đang chơi', variant: 'outline' };
    default:
      return { text: plan.status, variant: 'outline' };
  }
}

export function planStatusLabel(status: PlanStatus, isCurrent: boolean): string {
  if (isCurrent && status === 'playing') {
    return 'Current';
  }
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'playing':
      return 'Playing';
    case 'won':
      return 'Won';
    case 'lost':
      return 'Lost';
    case 'superseded':
      return 'Superseded';
    default:
      return status;
  }
}

export function isPlanExhausted(plan: Plan): boolean {
  return plan.completedThroughRound >= plan.generated.strategy.rounds.length;
}

export type SessionView = 'overview' | 'playing' | 'improve' | 'improve-review' | 'simulate';

export function sessionPresetName(preset: GamePolicyPreset | undefined): string {
  return preset?.name ?? 'Custom';
}
