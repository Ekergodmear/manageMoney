import type { ActiveSession, HistorySession, PersistedAppState } from '@/features/session/session-types';
import type { Session, SessionTimelineEvent } from '@/features/session/session-domain';

function mapLegacyTimeline(
  events: readonly { at: string; type: string; label?: string; roundIndex?: number; betAmount?: number }[],
): SessionTimelineEvent[] {
  return events.map((e) => ({
    at: e.at,
    type: e.type === 'generated' ? 'plan-added' : e.type === 'started' ? 'plan-started' : (e.type as SessionTimelineEvent['type']),
    ...(e.label !== undefined ? { label: e.label } : {}),
    ...(e.roundIndex !== undefined ? { roundIndex: e.roundIndex } : {}),
    ...(e.betAmount !== undefined ? { betAmount: e.betAmount } : {}),
  }));
}

function activeToSession(active: ActiveSession, presetId: string): Session {
  const planId = crypto.randomUUID();
  const status =
    active.status === 'won'
      ? 'won'
      : active.status === 'lost'
        ? 'lost'
        : active.status === 'playing'
          ? 'playing'
          : 'draft';

  return {
    id: active.id,
    sessionNumber: active.sessionNumber,
    title: `Session #${String(active.sessionNumber)}`,
    presetId: active.formValues.presetId ?? presetId,
    status,
    plans: [
      {
        id: planId,
        label: 'Plan A',
        origin: 'generate',
        parentPlanId: null,
        formValues: active.formValues,
        generated: active.generated,
        status:
          active.status === 'won'
            ? 'won'
            : active.status === 'playing'
              ? 'playing'
              : 'ready',
        completedThroughRound: active.completedThroughRound,
        createdAt: active.createdAt,
      },
    ],
    currentPlanId: planId,
    timeline: [
      { at: active.createdAt, type: 'session-created' },
      ...mapLegacyTimeline(active.timeline),
    ],
    notes: '',
    startedAt: active.status === 'playing' || active.status === 'won' ? active.createdAt : null,
    profitAmount: null,
    createdAt: active.createdAt,
    updatedAt: active.updatedAt,
  };
}

function historyToSession(item: HistorySession, presetId: string): Session {
  const planId = crypto.randomUUID();
  const sessionStatus =
    item.outcome === 'won' ? 'won' : item.outcome === 'lost' ? 'lost' : 'stopped';

  return {
    id: item.id,
    sessionNumber: item.sessionNumber,
    title: item.label,
    presetId: item.formValues.presetId ?? presetId,
    status: sessionStatus,
    plans: [
      {
        id: planId,
        label: 'Plan A',
        origin: 'generate',
        parentPlanId: null,
        formValues: item.formValues,
        generated: item.generated,
        status: item.outcome === 'won' ? 'won' : 'lost',
        completedThroughRound: item.completedRounds,
        createdAt: item.finishedAt,
        finishedAt: item.finishedAt,
      },
    ],
    currentPlanId: planId,
    timeline: mapLegacyTimeline(item.timeline),
    notes: '',
    startedAt: item.finishedAt,
    finishedAt: item.finishedAt,
    profitAmount: item.profitAmount,
    createdAt: item.finishedAt,
    updatedAt: item.finishedAt,
  };
}

export function migratePersistedState(raw: unknown): PersistedAppState {
  if (raw === null || raw === undefined || typeof raw !== 'object') {
    return {
      version: 3,
      theme: 'light',
      nextSessionNumber: 1,
      activeSessionId: null,
      sessions: [],
      customGamePresets: [],
      activePresetId: 'bingo-120',
      capitalPlanner: null,
    };
  }

  const state = raw as PersistedAppState & {
    version?: number;
    activeSession?: ActiveSession | null;
    history?: HistorySession[];
  };

  if (state.version === 3) {
    return {
      ...state,
      capitalPlanner: state.capitalPlanner ?? null,
    };
  }

  if (state.version === 2) {
    const sessions: Session[] = [];
    if (state.activeSession !== null && state.activeSession !== undefined) {
      sessions.push(activeToSession(state.activeSession, state.activePresetId));
    }
    for (const item of state.history ?? []) {
      sessions.push(historyToSession(item, state.activePresetId));
    }
    sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return {
      version: 3,
      theme: state.theme,
      nextSessionNumber: state.nextSessionNumber,
      activeSessionId: state.activeSession?.id ?? null,
      sessions,
      customGamePresets: state.customGamePresets,
      activePresetId: state.activePresetId,
      capitalPlanner: null,
    };
  }

  return {
    version: 3,
    theme: 'light',
    nextSessionNumber: 1,
    activeSessionId: null,
    sessions: [],
    customGamePresets: [],
    activePresetId: 'bingo-120',
    capitalPlanner: null,
  };
}