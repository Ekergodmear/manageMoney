import { normalizePlanningDraft } from '@/features/planning/planning-types';
import type { CapitalPlannerSnapshot } from '@/features/capital/capital-planner-types';
import type { RecommendationSet } from '@/features/recommendation/recommendation-set-types';
import type { PlanCandidate } from '@/features/planning/plan-candidate-types';
import type { ActiveSession, HistorySession, PersistedAppState } from '@/features/session/session-types';
import type { Session, SessionTimelineEvent } from '@/features/session/session-domain';
import { normalizeSessionLibraryFields } from '@/features/library/library-actions';

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
    favorite: false,
    archived: false,
    tags: [],
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
    favorite: false,
    archived: false,
    tags: [],
    createdAt: item.finishedAt,
    updatedAt: item.finishedAt,
  };
}

function normalizePlanCandidate(candidate: PlanCandidate | null | undefined): PlanCandidate | null {
  if (candidate === null || candidate === undefined) {
    return null;
  }
  if ('target' in candidate && candidate.target !== undefined) {
    return candidate;
  }
  const legacy = candidate as PlanCandidate & { sessionId: string; parentPlanId: string };
  return {
    ...legacy,
    target: 'append-plan',
    presetId: 'presetId' in legacy && typeof legacy.presetId === 'string' ? legacy.presetId : 'bingo-120',
  };
}

function normalizeCapitalPlanner(
  snapshot: CapitalPlannerSnapshot | null | undefined,
): CapitalPlannerSnapshot | null {
  if (snapshot === null || snapshot === undefined) {
    return null;
  }
  const legacy = snapshot as CapitalPlannerSnapshot & { result?: unknown; generatedAt?: string };
  return {
    totalBankroll: legacy.totalBankroll,
    strategy: legacy.strategy,
    risk: legacy.risk,
    presetId: legacy.presetId,
  };
}

function normalizeRecommendationSet(raw: unknown): RecommendationSet | null {
  if (raw === null || raw === undefined || typeof raw !== 'object') {
    return null;
  }
  const legacy = raw as RecommendationSet & {
    bundleId?: string;
    createdAt?: string;
  };
  if ('setId' in legacy && typeof legacy.setId === 'string') {
    return legacy;
  }
  if ('bundleId' in legacy && typeof legacy.bundleId === 'string') {
    return {
      ...legacy,
      setId: legacy.bundleId,
      generatedAt: legacy.generatedAt ?? legacy.createdAt ?? new Date().toISOString(),
    };
  }
  return null;
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
      recommendationSet: null,
      libraryCollections: [],
      planningDraft: null,
      planCandidate: null,
    };
  }

  const state = raw as PersistedAppState & {
    version?: number;
    activeSession?: ActiveSession | null;
    history?: HistorySession[];
    strategyRecommendationBundle?: unknown;
  };

  if (state.version === 3) {
    const recommendationSet =
      normalizeRecommendationSet(state.recommendationSet) ??
      normalizeRecommendationSet(state.strategyRecommendationBundle);
    return {
      ...state,
      capitalPlanner: normalizeCapitalPlanner(state.capitalPlanner),
      recommendationSet,
      libraryCollections: state.libraryCollections ?? [],
      planningDraft: normalizePlanningDraft(state.planningDraft),
      planCandidate: normalizePlanCandidate(state.planCandidate),
      sessions: (state.sessions ?? []).map(normalizeSessionLibraryFields),
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
      recommendationSet: null,
      libraryCollections: [],
      planningDraft: null,
      planCandidate: null,
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
    recommendationSet: null,
    libraryCollections: [],
    planningDraft: null,
    planCandidate: null,
  };
}