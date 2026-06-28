import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import type { ImproveOption } from '@/features/improve/improve-service';
import { applyImproveOption } from '@/features/improve/improve-service';
import { accumulatedAtRound } from '@/features/planner/plan-display';
import type { GenerateResult, PlannerFormValues } from '@/features/planner/plan-service';
import { continuePlan } from '@/features/planner/plan-service';

export type PlanOrigin = 'generate' | 'improve' | 'continue';

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
  readonly createdAt: string;
  readonly updatedAt: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function planLabel(index: number): string {
  return `Plan ${String.fromCharCode(65 + index)}`;
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

export function createSessionFromGenerate(
  values: PlannerFormValues,
  result: GenerateResult,
  presetId: string,
  sessionNumber: number,
): Session {
  const sessionId = crypto.randomUUID();
  const planId = crypto.randomUUID();
  const at = nowIso();
  const plan: Plan = {
    id: planId,
    label: planLabel(0),
    origin: 'generate',
    parentPlanId: null,
    formValues: values,
    generated: result,
    status: 'ready',
    completedThroughRound: 0,
    createdAt: at,
  };

  return {
    id: sessionId,
    sessionNumber,
    title: `Session #${String(sessionNumber)}`,
    presetId,
    status: 'draft',
    plans: [plan],
    currentPlanId: planId,
    timeline: [
      { at, type: 'session-created' },
      { at, type: 'plan-added', planId, label: 'Generate' },
    ],
    notes: '',
    startedAt: null,
    profitAmount: null,
    createdAt: at,
    updatedAt: at,
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
  const round = plan.generated.strategy.rounds[roundIndex - 1];
  const updatedPlan: Plan = {
    ...plan,
    completedThroughRound: roundIndex,
  };
  return {
    ...session,
    plans: session.plans.map((p) => (p.id === plan.id ? updatedPlan : p)),
    timeline: addEvent(session.timeline, {
      type: 'bet',
      planId: plan.id,
      roundIndex,
      betAmount: round?.betAmount,
    }),
    updatedAt: nowIso(),
  };
}

export function undoBetOnPlan(session: Session): Session | null {
  const plan = getCurrentPlan(session);
  if (plan === null || plan.completedThroughRound <= 0) {
    return null;
  }
  const updatedPlan: Plan = {
    ...plan,
    completedThroughRound: plan.completedThroughRound - 1,
  };
  return {
    ...session,
    plans: session.plans.map((p) => (p.id === plan.id ? updatedPlan : p)),
    timeline: addEvent(session.timeline, { type: 'undo', planId: plan.id }),
    updatedAt: nowIso(),
  };
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

export function addPlanFromContinue(
  session: Session,
  targetRoundCount: number,
): { session: Session; error?: string } {
  const parent = getCurrentPlan(session);
  if (parent === null) {
    return { session, error: 'Không có plan hiện tại.' };
  }

  const outcome = continuePlan(parent.formValues, targetRoundCount);
  if (outcome.fieldErrors !== undefined || outcome.result === undefined) {
    return { session, error: 'Không tạo được plan tiếp theo.' };
  }

  const lostParent = parent.status === 'playing' ? markPlanFinished(parent, 'lost') : parent;
  const planId = crypto.randomUUID();
  const newPlan: Plan = {
    id: planId,
    label: planLabel(session.plans.length),
    origin: 'continue',
    parentPlanId: parent.id,
    formValues: { ...parent.formValues, roundCount: String(targetRoundCount) },
    generated: outcome.result,
    status: 'playing',
    completedThroughRound: parent.completedThroughRound,
    createdAt: nowIso(),
  };

  return {
    session: {
      ...session,
      status: 'playing',
      plans: [
        ...session.plans.map((p) => (p.id === parent.id ? lostParent : p)),
        newPlan,
      ],
      currentPlanId: planId,
      timeline: addEvent(session.timeline, {
        type: 'continue',
        planId,
        label: `Continue → ${String(targetRoundCount)} vòng`,
      }),
      updatedAt: nowIso(),
    },
  };
}

export function addPlanFromImprove(session: Session, option: ImproveOption): Session {
  const parent = getCurrentPlan(session);
  if (parent === null) {
    return session;
  }

  const newFormValues = applyImproveOption(parent.formValues, option);
  const capped = Math.min(
    parent.completedThroughRound,
    option.result.strategy.rounds.length,
  );
  const supersededParent =
    parent.status === 'playing' || parent.status === 'ready'
      ? { ...parent, status: 'superseded' as const, finishedAt: nowIso() }
      : parent;

  const planId = crypto.randomUUID();
  const newPlan: Plan = {
    id: planId,
    label: planLabel(session.plans.length),
    origin: 'improve',
    parentPlanId: parent.id,
    formValues: newFormValues,
    generated: option.result,
    status: parent.status === 'playing' ? 'playing' : 'ready',
    completedThroughRound: capped,
    createdAt: nowIso(),
  };

  return {
    ...session,
    plans: [
      ...session.plans.map((p) => (p.id === parent.id ? supersededParent : p)),
      newPlan,
    ],
    currentPlanId: planId,
    timeline: addEvent(session.timeline, {
      type: 'improve',
      planId,
      label: option.label,
    }),
    updatedAt: nowIso(),
  };
}

export function updateSessionNotes(session: Session, notes: string): Session {
  return {
    ...session,
    notes,
    timeline: addEvent(session.timeline, { type: 'note-updated', label: 'Notes' }),
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
      return 'Improve';
    case 'continue':
      return 'Continue';
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

export type SessionView = 'overview' | 'playing' | 'improve' | 'simulate';

export function sessionPresetName(preset: GamePolicyPreset | undefined): string {
  return preset?.name ?? 'Custom';
}
