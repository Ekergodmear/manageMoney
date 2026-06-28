import type { GenerateResult, PlannerFormValues } from '@/features/planner/plan-service';

export type SessionStatus = 'ready' | 'playing' | 'won' | 'lost';

export type TimelineEventType =
  | 'generated'
  | 'started'
  | 'bet'
  | 'undo'
  | 'won'
  | 'lost'
  | 'continued'
  | 'finished';

export interface SessionTimelineEvent {
  readonly type: TimelineEventType;
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
  readonly formValues: PlannerFormValues;
  readonly generated: GenerateResult;
  readonly timeline: readonly SessionTimelineEvent[];
}

export interface ActiveSession {
  readonly id: string;
  readonly sessionNumber: number;
  readonly status: SessionStatus;
  readonly formValues: PlannerFormValues;
  readonly generated: GenerateResult;
  readonly completedThroughRound: number;
  readonly timeline: readonly SessionTimelineEvent[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PersistedAppState {
  readonly version: 1;
  readonly theme: 'light' | 'dark';
  readonly nextSessionNumber: number;
  readonly activeSession: ActiveSession | null;
  readonly history: readonly HistorySession[];
}

export const EMPTY_PERSISTED_STATE: PersistedAppState = {
  version: 1,
  theme: 'light',
  nextSessionNumber: 1,
  activeSession: null,
  history: [],
};
