/**
 * Event taxonomy — Domain (nghiệp vụ) vs System (vận hành).
 * `schemaVersion` tránh nhầm với Session.version hay app version.
 */
export const EVENT_SCHEMA_VERSION = 1 as const;

export interface AppEventBase {
  readonly schemaVersion: typeof EVENT_SCHEMA_VERSION;
  readonly occurredAt: Date;
}

// --- Domain events (nghiệp vụ) ---

export interface PlanningViewedEvent extends AppEventBase {
  readonly type: 'PlanningViewed';
}

export interface PlanGeneratedEvent extends AppEventBase {
  readonly type: 'PlanGenerated';
  readonly sessionId: string;
  readonly planId: string;
}

export interface PlanningDraftSavedEvent extends AppEventBase {
  readonly type: 'PlanningDraftSaved';
  readonly draftId: string;
  readonly planId: string;
}

export interface SessionCreatedEvent extends AppEventBase {
  readonly type: 'SessionCreated';
  readonly sessionId: string;
  readonly planId: string;
  readonly originDraftId?: string;
  readonly originRecommendationId?: string;
}

export interface RecommendationGeneratedEvent extends AppEventBase {
  readonly type: 'RecommendationGenerated';
  readonly setId: string;
  readonly source: 'capital' | 'scenario';
  readonly recommendationCount: number;
  readonly presetId: string;
}

export interface RecommendationSelectedEvent extends AppEventBase {
  readonly type: 'RecommendationSelected';
  readonly setId: string;
  readonly source: 'capital' | 'scenario';
  readonly recommendationId: string;
}

/** @deprecated Use RecommendationGeneratedEvent */
export type CapitalRecommendationGeneratedEvent = RecommendationGeneratedEvent;
/** @deprecated Use RecommendationSelectedEvent */
export type CapitalRecommendationSelectedEvent = RecommendationSelectedEvent;

export interface SessionStartedEvent extends AppEventBase {
  readonly type: 'SessionStarted';
  readonly sessionId: string;
  readonly planId: string;
}

export interface SessionOpenedEvent extends AppEventBase {
  readonly type: 'SessionOpened';
  readonly sessionId: string;
}

export interface RoundCompletedEvent extends AppEventBase {
  readonly type: 'RoundCompleted';
  readonly sessionId: string;
  readonly planId: string;
  readonly roundIndex: number;
}

export interface RoundWonEvent extends AppEventBase {
  readonly type: 'RoundWon';
  readonly sessionId: string;
  readonly planId: string;
  readonly roundIndex: number;
}

export interface ContinuationCreatedEvent extends AppEventBase {
  readonly type: 'ContinuationCreated';
  readonly sessionId: string;
  readonly planId: string;
  readonly parentPlanId: string;
}

export interface ImproveAppliedEvent extends AppEventBase {
  readonly type: 'ImproveApplied';
  readonly sessionId: string;
  readonly planId: string;
  readonly parentPlanId: string;
}

export interface ImprovementCandidateCreatedEvent extends AppEventBase {
  readonly type: 'ImprovementCandidateCreated';
  readonly candidateId: string;
  readonly sessionId: string | null;
  readonly parentPlanId: string | null;
  readonly source: 'improve' | 'capital' | 'scenario';
}

export interface PlanPromotedEvent extends AppEventBase {
  readonly type: 'PlanPromoted';
  readonly sessionId: string;
  readonly planId: string;
  readonly parentPlanId: string;
  readonly origin: 'generate' | 'improve' | 'continue' | 'capital' | 'scenario';
}

export interface SessionWonEvent extends AppEventBase {
  readonly type: 'SessionWon';
  readonly sessionId: string;
  readonly planId: string;
}

export interface SessionArchivedEvent extends AppEventBase {
  readonly type: 'SessionArchived';
  readonly sessionId: string;
}

export interface PresetSavedEvent extends AppEventBase {
  readonly type: 'PresetSaved';
  readonly presetId: string;
}

export interface ScenarioPromotedEvent extends AppEventBase {
  readonly type: 'ScenarioPromoted';
  readonly scenarioId: string;
}

export type DomainEvent =
  | PlanningViewedEvent
  | PlanGeneratedEvent
  | PlanningDraftSavedEvent
  | SessionCreatedEvent
  | RecommendationGeneratedEvent
  | RecommendationSelectedEvent
  | SessionStartedEvent
  | SessionOpenedEvent
  | RoundCompletedEvent
  | RoundWonEvent
  | ContinuationCreatedEvent
  | ImproveAppliedEvent
  | ImprovementCandidateCreatedEvent
  | PlanPromotedEvent
  | SessionWonEvent
  | SessionArchivedEvent
  | PresetSavedEvent
  | ScenarioPromotedEvent;

export type DomainEventType = DomainEvent['type'];

// --- System events (vận hành — Health chỉ nghe nhóm này) ---

export interface StorageOpenedEvent extends AppEventBase {
  readonly type: 'StorageOpened';
}

export interface StorageFailedEvent extends AppEventBase {
  readonly type: 'StorageFailed';
  readonly reason: string;
}

export interface MigrationCompletedEvent extends AppEventBase {
  readonly type: 'MigrationCompleted';
  readonly fromVersion: number;
  readonly toVersion: number;
}

export interface TelemetryFlushFailedEvent extends AppEventBase {
  readonly type: 'TelemetryFlushFailed';
  readonly reason: string;
}

export interface TelemetryFlushedEvent extends AppEventBase {
  readonly type: 'TelemetryFlushed';
  readonly count: number;
}

export interface SyncStartedEvent extends AppEventBase {
  readonly type: 'SyncStarted';
}

export interface SyncCompletedEvent extends AppEventBase {
  readonly type: 'SyncCompleted';
}

export interface SyncFailedEvent extends AppEventBase {
  readonly type: 'SyncFailed';
  readonly reason: string;
}

export type SystemEvent =
  | StorageOpenedEvent
  | StorageFailedEvent
  | MigrationCompletedEvent
  | TelemetryFlushFailedEvent
  | TelemetryFlushedEvent
  | SyncStartedEvent
  | SyncCompletedEvent
  | SyncFailedEvent;

export type SystemEventType = SystemEvent['type'];

export type AppEvent = DomainEvent | SystemEvent;

export type AppEventType = AppEvent['type'];

export type DomainEventOf<T extends DomainEventType> = Extract<DomainEvent, { type: T }>;

export type SystemEventOf<T extends SystemEventType> = Extract<SystemEvent, { type: T }>;

export type AppEventOf<T extends AppEventType> = Extract<AppEvent, { type: T }>;

export type AppEventHandler<T extends AppEventType> = (event: AppEventOf<T>) => void;

export type Unsubscribe = () => void;

/** Telemetry ghi Domain + System */
export const TELEMETRY_EVENT_TYPES: readonly AppEventType[] = [
  'PlanningViewed',
  'PlanGenerated',
  'PlanningDraftSaved',
  'SessionCreated',
  'RecommendationGenerated',
  'RecommendationSelected',
  'SessionStarted',
  'SessionOpened',
  'RoundCompleted',
  'RoundWon',
  'ContinuationCreated',
  'ImproveApplied',
  'ImprovementCandidateCreated',
  'PlanPromoted',
  'SessionWon',
  'SessionArchived',
  'PresetSaved',
  'ScenarioPromoted',
  'StorageOpened',
  'StorageFailed',
  'MigrationCompleted',
  'TelemetryFlushFailed',
  'TelemetryFlushed',
  'SyncStarted',
  'SyncCompleted',
  'SyncFailed',
] as const;

/** Health chỉ nghe System */
export const HEALTH_EVENT_TYPES: readonly SystemEventType[] = [
  'StorageOpened',
  'StorageFailed',
  'MigrationCompleted',
  'TelemetryFlushFailed',
  'SyncStarted',
  'SyncCompleted',
  'SyncFailed',
] as const;

export const ALL_APP_EVENT_TYPES: readonly AppEventType[] = [
  ...TELEMETRY_EVENT_TYPES,
] as const;

/** @deprecated Use EVENT_SCHEMA_VERSION */
export const DOMAIN_EVENT_VERSION = EVENT_SCHEMA_VERSION;
