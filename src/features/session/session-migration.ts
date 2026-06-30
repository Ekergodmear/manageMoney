import { normalizePlanningDraft } from '@/features/planning/planning-types';
import type { CapitalPlannerSnapshot } from '@/features/capital/capital-planner-types';
import { normalizeRecommendationSet as enrichRecommendationSet } from '@/features/capital/capital-recommendation-mapper';
import type { RecommendationSet } from '@/features/recommendation/recommendation-set-types';
import type { PlanCandidate } from '@/features/planning/plan-candidate-types';
import type { PlannerFormValues } from '@/features/planner/plan-service';
import { DEFAULT_MARKET_ID } from '@/features/game-data/markets/market-definition';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  EMPTY_NOTIFICATION_STATE,
} from '@/features/notifications/notification-types';
import { pruneNotifications } from '@/features/notifications/notification-store';
import type {
  ActiveSession,
  HistorySession,
  PersistedAppState,
} from '@/features/session/session-types';
import type { Plan, Session, SessionTimelineEvent } from '@/features/session/session-domain';
import { normalizeSessionLibraryFields } from '@/features/library/library-actions';

type LegacyPlannerFormValues = Omit<PlannerFormValues, 'marketId' | 'presetId'> & {
  marketId?: string;
  presetId?: string;
};

type LegacyPlan = Omit<Plan, 'marketId' | 'formValues'> & {
  marketId?: string;
  formValues: LegacyPlannerFormValues;
};

type LegacySession = Omit<Session, 'playedRounds' | 'lastSettledDrawKey'> & {
  betMarketId?: string;
  playedRounds?: Session['playedRounds'];
  lastSettledDrawKey?: string | null;
};

type LegacyPlanCandidateInput = {
  marketId?: string;
  target?: PlanCandidate['target'];
  presetId?: string;
  formValues?: LegacyPlannerFormValues;
  sessionId?: string | null;
  parentPlanId?: string | null;
};

type LegacyPersistedFields = {
  version?: number;
  libraryCollections?: PersistedAppState['libraryCollections'];
  sessions?: PersistedAppState['sessions'];
  notificationPreferences?: PersistedAppState['notificationPreferences'];
};

type RawPersistedState = Omit<
  PersistedAppState,
  'version' | 'libraryCollections' | 'sessions' | 'notificationPreferences'
> &
  LegacyPersistedFields & {
    activeSession?: ActiveSession | null;
    history?: HistorySession[];
    strategyRecommendationBundle?: unknown;
  };

function migratePlan(plan: LegacyPlan, legacyBetMarketId?: string): Plan {
  const marketId =
    plan.marketId ?? plan.formValues.marketId ?? legacyBetMarketId ?? DEFAULT_MARKET_ID;
  const presetId = plan.formValues.presetId ?? 'bingo-120';
  return {
    ...plan,
    marketId,
    formValues: { ...plan.formValues, marketId, presetId },
  };
}

function migrateSession(session: LegacySession): Session {
  const legacyMarket = session.betMarketId;
  const base = normalizeSessionLibraryFields({
    ...session,
    lastSettledDrawKey: session.lastSettledDrawKey ?? null,
    playedRounds: session.playedRounds ?? [],
    plans: session.plans.map((p) => migratePlan(p as LegacyPlan, legacyMarket)),
  });
  const migrated = { ...(base as LegacySession) };
  delete migrated.betMarketId;
  return {
    ...migrated,
    lastSettledDrawKey: migrated.lastSettledDrawKey ?? null,
    playedRounds: migrated.playedRounds ?? [],
  };
}

function mapLegacyTimeline(
  events: readonly {
    at: string;
    type: string;
    label?: string;
    roundIndex?: number;
    betAmount?: number;
  }[],
): SessionTimelineEvent[] {
  return events.map((e) => ({
    at: e.at,
    type:
      e.type === 'generated'
        ? 'plan-added'
        : e.type === 'started'
          ? 'plan-started'
          : (e.type as SessionTimelineEvent['type']),
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
  const legacyForm = active.formValues as LegacyPlannerFormValues;
  const formValues = {
    ...active.formValues,
    marketId: legacyForm.marketId ?? DEFAULT_MARKET_ID,
  };

  return migrateSession({
    id: active.id,
    sessionNumber: active.sessionNumber,
    title: `Session #${String(active.sessionNumber)}`,
    presetId: legacyForm.presetId ?? presetId,
    status,
    plans: [
      migratePlan({
        id: planId,
        label: 'Plan A',
        origin: 'generate',
        parentPlanId: null,
        marketId: formValues.marketId,
        formValues,
        generated: active.generated,
        status: active.status === 'won' ? 'won' : active.status === 'playing' ? 'playing' : 'ready',
        completedThroughRound: active.completedThroughRound,
        createdAt: active.createdAt,
      }),
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
    lastSettledDrawKey: null,
    playedRounds: [],
    createdAt: active.createdAt,
    updatedAt: active.updatedAt,
  });
}

function historyToSession(item: HistorySession, presetId: string): Session {
  const planId = crypto.randomUUID();
  const sessionStatus =
    item.outcome === 'won' ? 'won' : item.outcome === 'lost' ? 'lost' : 'stopped';
  const legacyForm = item.formValues as LegacyPlannerFormValues;
  const formValues = {
    ...item.formValues,
    marketId: legacyForm.marketId ?? DEFAULT_MARKET_ID,
  };

  return migrateSession({
    id: item.id,
    sessionNumber: item.sessionNumber,
    title: item.label,
    presetId: legacyForm.presetId ?? presetId,
    status: sessionStatus,
    plans: [
      migratePlan({
        id: planId,
        label: 'Plan A',
        origin: 'generate',
        parentPlanId: null,
        marketId: formValues.marketId,
        formValues,
        generated: item.generated,
        status: item.outcome === 'won' ? 'won' : 'lost',
        completedThroughRound: item.completedRounds,
        createdAt: item.finishedAt,
        finishedAt: item.finishedAt,
      }),
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
    lastSettledDrawKey: null,
    playedRounds: [],
    createdAt: item.finishedAt,
    updatedAt: item.finishedAt,
  });
}

function normalizePlanCandidate(
  candidate: LegacyPlanCandidateInput | null | undefined,
): PlanCandidate | null {
  if (candidate === null || candidate === undefined) {
    return null;
  }
  const resolvedMarketId =
    typeof candidate.marketId === 'string'
      ? candidate.marketId
      : candidate.formValues !== undefined
        ? (candidate.formValues.marketId ?? DEFAULT_MARKET_ID)
        : DEFAULT_MARKET_ID;
  if (candidate.target !== undefined) {
    const withMarket =
      candidate.formValues !== undefined
        ? {
            ...candidate,
            marketId: resolvedMarketId,
            formValues: {
              ...candidate.formValues,
              marketId: candidate.formValues.marketId ?? resolvedMarketId,
            },
          }
        : { ...candidate, marketId: resolvedMarketId };
    return withMarket as PlanCandidate;
  }
  return {
    ...candidate,
    target: 'append-plan',
    presetId: typeof candidate.presetId === 'string' ? candidate.presetId : 'bingo-120',
  } as PlanCandidate;
}

function normalizeCapitalPlanner(
  snapshot: CapitalPlannerSnapshot | null | undefined,
): CapitalPlannerSnapshot | null {
  if (snapshot === null || snapshot === undefined) {
    return null;
  }
  const legacy = snapshot as Omit<CapitalPlannerSnapshot, 'marketId'> & {
    marketId?: string;
    result?: unknown;
    generatedAt?: string;
  };
  return {
    totalBankroll: legacy.totalBankroll,
    strategy: legacy.strategy,
    risk: legacy.risk,
    presetId: legacy.presetId,
    marketId: legacy.marketId ?? DEFAULT_MARKET_ID,
  };
}

function migrateLegacyRecommendationSet(raw: unknown): RecommendationSet | null {
  if (raw === null || raw === undefined || typeof raw !== 'object') {
    return null;
  }
  const legacy = raw as Partial<RecommendationSet> & {
    bundleId?: string;
    createdAt?: string;
  };
  if ('setId' in legacy && typeof legacy.setId === 'string') {
    return legacy as RecommendationSet;
  }
  if ('bundleId' in legacy && typeof legacy.bundleId === 'string') {
    return {
      ...legacy,
      setId: legacy.bundleId,
      generatedAt: legacy.generatedAt ?? legacy.createdAt ?? new Date().toISOString(),
    } as RecommendationSet;
  }
  return null;
}

export function migratePersistedState(raw: unknown): PersistedAppState {
  if (raw === null || raw === undefined || typeof raw !== 'object') {
    return {
      version: 6,
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
      notifications: EMPTY_NOTIFICATION_STATE.notifications,
      notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
    };
  }

  const state = raw as RawPersistedState;

  const migrateCore = (s: RawPersistedState): PersistedAppState => {
    const rawRecommendationSet =
      migrateLegacyRecommendationSet(s.recommendationSet) ??
      migrateLegacyRecommendationSet(state.strategyRecommendationBundle);
    const recommendationSet =
      rawRecommendationSet !== null ? enrichRecommendationSet(rawRecommendationSet) : null;
    const legacyNotifications = s.notifications;
    return {
      ...s,
      version: 6,
      capitalPlanner: normalizeCapitalPlanner(s.capitalPlanner),
      recommendationSet,
      libraryCollections: s.libraryCollections ?? [],
      planningDraft: normalizePlanningDraft(s.planningDraft),
      planCandidate: normalizePlanCandidate(s.planCandidate),
      sessions: (s.sessions ?? []).map((session) => migrateSession(session as LegacySession)),
      notifications: Array.isArray(legacyNotifications)
        ? pruneNotifications(legacyNotifications as PersistedAppState['notifications'])
        : EMPTY_NOTIFICATION_STATE.notifications,
      notificationPreferences: s.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES,
    };
  };

  if (state.version === 5 || state.version === 6) {
    return migrateCore(state);
  }

  if (state.version === 4 || state.version === 3) {
    return migrateCore({ ...state, version: 6 });
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

    return migrateCore({
      version: 6,
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
      notifications: EMPTY_NOTIFICATION_STATE.notifications,
      notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
    });
  }

  return migrateCore({
    version: 6,
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
    notifications: EMPTY_NOTIFICATION_STATE.notifications,
    notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
  });
}
