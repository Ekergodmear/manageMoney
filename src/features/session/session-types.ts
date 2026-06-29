import type { CapitalPlannerSnapshot } from '@/features/capital/capital-planner-types';
import type { LibraryCollection } from '@/features/library/library-types';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import type { PlanningDraft } from '@/features/planning/planning-types';
import type { PlanCandidate } from '@/features/planning/plan-candidate-types';
import type { RecommendationSet } from '@/features/recommendation/recommendation-set-types';
import type { Session } from '@/features/session/session-domain';

export interface PersistedAppState {
  readonly version: 3;
  readonly theme: 'light' | 'dark';
  readonly nextSessionNumber: number;
  readonly activeSessionId: string | null;
  readonly sessions: readonly Session[];
  readonly customGamePresets: readonly GamePolicyPreset[];
  readonly activePresetId: string;
  readonly capitalPlanner: CapitalPlannerSnapshot | null;
  readonly recommendationSet: RecommendationSet | null;
  readonly libraryCollections: readonly LibraryCollection[];
  readonly planningDraft: PlanningDraft | null;
  readonly planCandidate: PlanCandidate | null;
}

export const EMPTY_PERSISTED_STATE: PersistedAppState = {
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

// Legacy types kept for migration only
export type SessionStatus = 'ready' | 'playing' | 'won' | 'lost';

export interface SessionTimelineEvent {
  readonly type: string;
  readonly at: string;
  readonly roundIndex?: number;
  readonly betAmount?: number;
  readonly label?: string;
}

export interface HistorySession {
  readonly id: string;
  readonly sessionNumber: number;
  readonly label: string;
  readonly roundCount: number;
  readonly completedRounds: number;
  readonly outcome: 'won' | 'lost' | 'cancelled';
  readonly profitAmount: number | null;
  readonly totalSpent: number;
  readonly finishedAt: string;
  readonly formValues: import('@/features/planner/plan-service').PlannerFormValues;
  readonly generated: import('@/features/planner/plan-service').GenerateResult;
  readonly timeline: readonly SessionTimelineEvent[];
}

export interface ActiveSession {
  readonly id: string;
  readonly sessionNumber: number;
  readonly status: SessionStatus;
  readonly formValues: import('@/features/planner/plan-service').PlannerFormValues;
  readonly generated: import('@/features/planner/plan-service').GenerateResult;
  readonly completedThroughRound: number;
  readonly timeline: readonly SessionTimelineEvent[];
  readonly createdAt: string;
  readonly updatedAt: string;
}
