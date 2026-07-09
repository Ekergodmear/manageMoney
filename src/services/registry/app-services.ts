import type { AppConfig, CreateAppConfigOptions } from '@/services/config/AppConfig';
import { createAppConfig } from '@/services/config/AppConfig';
import type { Clock } from '@/services/clock/clock';
import type { Flags } from '@/services/feature-flags/Flags';
import { createFlags } from '@/services/feature-flags/Flags';
import { SystemClock } from '@/services/clock/system-clock';
import type { EventBus } from '@/services/events/domain-events';
import { EventBus as EventBusImpl } from '@/services/events/domain-events';
import type { HealthService } from '@/services/health/health-service';
import { HealthService as HealthServiceImpl } from '@/services/health/health-service';
import type { Logger } from '@/services/logger/logger';
import { Logger as LoggerImpl } from '@/services/logger/logger';
import type { LogSink } from '@/services/logger/sinks/log-sink';
import { ConsoleSink } from '@/services/logger/sinks/console-sink';
import type { PersistenceHealthMonitor } from '@/services/storage/persistence-health';
import { PersistenceHealthMonitor as PersistenceHealthMonitorImpl } from '@/services/storage/persistence-health';
import type { PersistenceService } from '@/services/storage/PersistenceService';
import { PersistenceService as PersistenceServiceImpl } from '@/services/storage/PersistenceService';
import { IndexedDbDriver } from '@/services/storage/IndexedDbDriver';
import type { StorageDriver } from '@/services/storage/StorageDriver';
import type { TelemetryStore } from '@/services/telemetry/telemetry-store';
import { TelemetryStore as TelemetryStoreImpl } from '@/services/telemetry/telemetry-store';
import { EventStore } from '@/services/telemetry/event-store';

export interface AppServices {
  readonly clock: Clock;
  readonly storage: PersistenceService;
  readonly storageDriver: StorageDriver;
  readonly persistenceHealth: PersistenceHealthMonitor;
  readonly events: EventBus;
  readonly telemetry: TelemetryStore;
  readonly logger: Logger;
  readonly health: HealthService;
  readonly config: AppConfig;
  readonly flags: Flags;
}

export interface CreateAppServicesOptions {
  readonly clock?: Clock;
  readonly storageDriver?: StorageDriver;
  readonly logSinks?: readonly LogSink[];
  readonly config?: CreateAppConfigOptions;
  /** Skip operational wiring (M1-only tests) */
  readonly operational?: boolean;
}

function createNoopOperational(
  clock: Clock,
): Pick<AppServices, 'telemetry' | 'logger' | 'health' | 'persistenceHealth'> {
  const noopTelemetry = {
    append: () => Promise.resolve(),
    readAll: () => Promise.resolve([]),
    dispose: () => undefined,
  } as unknown as TelemetryStore;
  const noopLogger = { log: () => undefined, dispose: () => undefined } as unknown as Logger;
  const noopHealth = {
    getSnapshot: () => ({ status: 'ok' as const, messages: [], updatedAt: clock.now() }),
    dispose: () => undefined,
  } as unknown as HealthService;
  const noopPersistenceHealth = {
    getView: () => ({
      status: 'healthy' as const,
      lastLoadAt: null,
      lastSaveAt: null,
      lastMigration: null,
      lastError: null,
    }),
    setOffline: () => undefined,
    dispose: () => undefined,
  } as unknown as PersistenceHealthMonitor;
  return {
    telemetry: noopTelemetry,
    logger: noopLogger,
    health: noopHealth,
    persistenceHealth: noopPersistenceHealth,
  };
}

export function createAppServices(options: CreateAppServicesOptions = {}): AppServices {
  const clock = options.clock ?? SystemClock;
  const storageDriver = options.storageDriver ?? new IndexedDbDriver();
  const config = createAppConfig(options.config);
  const flags = createFlags(config);
  const events = new EventBusImpl(clock);
  const storage = new PersistenceServiceImpl(storageDriver, events);
  const persistenceHealth = new PersistenceHealthMonitorImpl(events, clock);

  if (options.operational === false) {
    persistenceHealth.dispose();
    return {
      clock,
      storage,
      storageDriver,
      events,
      config,
      flags,
      ...createNoopOperational(clock),
    };
  }

  const eventStore = new EventStore(storageDriver);
  const telemetry = new TelemetryStoreImpl(eventStore, events, {
    enabled: flags.isEnabled('telemetry'),
  });
  const logger = new LoggerImpl(events, options.logSinks ?? [new ConsoleSink()]);
  const health = new HealthServiceImpl(events);

  return {
    clock,
    storage,
    storageDriver,
    persistenceHealth,
    events,
    telemetry,
    logger,
    health,
    config,
    flags,
  };
}

let defaultServices: AppServices | null = null;

/** Core/bootstrap only — workspace dùng useServices() */
export function getAppServices(): AppServices {
  defaultServices ??= createAppServices();
  return defaultServices;
}

/** Test-only — reset singleton */
export function resetAppServicesForTests(services?: AppServices): void {
  if (defaultServices !== null) {
    defaultServices.telemetry.dispose();
    defaultServices.logger.dispose();
    defaultServices.health.dispose();
    defaultServices.persistenceHealth.dispose();
  }
  defaultServices = services ?? null;
}
