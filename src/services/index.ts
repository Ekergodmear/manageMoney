export type { Clock } from '@/services/clock/clock';
export { FakeClock } from '@/services/clock/fake-clock';
export { SystemClock } from '@/services/clock/system-clock';

export type {
  AppEvent,
  AppEventHandler,
  AppEventOf,
  AppEventType,
  ContinuationCreatedEvent,
  DomainEvent,
  DomainEventHandler,
  DomainEventOf,
  DomainEventType,
  ImproveAppliedEvent,
  MigrationCompletedEvent,
  PlanGeneratedEvent,
  PlanningViewedEvent,
  PresetSavedEvent,
  RoundCompletedEvent,
  RoundWonEvent,
  ScenarioPromotedEvent,
  SessionArchivedEvent,
  SessionOpenedEvent,
  SessionStartedEvent,
  SessionWonEvent,
  StorageFailedEvent,
  StorageOpenedEvent,
  SystemEvent,
  SystemEventType,
  SyncFailedEvent,
  Unsubscribe,
} from '@/services/events/event-types';
export {
  ALL_APP_EVENT_TYPES,
  EVENT_SCHEMA_VERSION,
  HEALTH_EVENT_TYPES,
  TELEMETRY_EVENT_TYPES,
  DOMAIN_EVENT_VERSION,
} from '@/services/events/event-types';
export { DomainEventBus, EventBus, isAppEvent, isDomainEvent } from '@/services/events/domain-events';
export { registerEventSubscriber } from '@/services/events/subscribers';

export type { StorageDriver } from '@/services/storage/StorageDriver';
export { IndexedDbDriver } from '@/services/storage/IndexedDbDriver';
export { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
export { PersistenceService } from '@/services/storage/PersistenceService';
export { AppStateRepository, APP_STATE_STORAGE_KEY } from '@/services/storage/repositories/app-state-repository';

export { EventStore, TELEMETRY_EVENT_LOG_KEY } from '@/services/telemetry/event-store';
export type { StoredAppEvent } from '@/services/telemetry/event-store';
export { TelemetryStore } from '@/services/telemetry/telemetry-store';

export { Logger } from '@/services/logger/logger';
export type { LogEntry, LogSink } from '@/services/logger/sinks/log-sink';
export { ConsoleSink } from '@/services/logger/sinks/console-sink';

export { HealthService } from '@/services/health/health-service';
export type { HealthSnapshot, HealthStatus } from '@/services/health/health-service';

export type { AppConfig, CreateAppConfigOptions, BuildInfo, CloudConfig, DeveloperConfig, Environment, TelemetryConfig, UiConfig } from '@/services/config';
export { createAppConfig, resolveEnvironment } from '@/services/config';

export type { FeatureFlag, Flags } from '@/services/feature-flags/Flags';
export { createFlags, FeatureFlags } from '@/services/feature-flags/Flags';
export { FlagProvider } from '@/services/feature-flags/FlagProvider';
export { useFlags } from '@/services/feature-flags/useFlags';

export type { AppServices, CreateAppServicesOptions } from '@/services/registry/app-services';
export {
  createAppServices,
  getAppServices,
  resetAppServicesForTests,
} from '@/services/registry/app-services';
export {
  AppServicesProvider,
  useAppServices,
  useAppServicesOptional,
  useServices,
} from '@/services/registry/AppServicesProvider';
