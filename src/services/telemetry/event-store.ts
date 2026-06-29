import type { AppEvent } from '@/services/events/event-types';
import type { StorageDriver } from '@/services/storage/StorageDriver';

export const TELEMETRY_EVENT_LOG_KEY = 'telemetry-event-log';

export interface StoredAppEvent {
  readonly schemaVersion: number;
  readonly type: string;
  readonly occurredAt: string;
  readonly payload: Record<string, unknown>;
}

export function serializeAppEvent(event: AppEvent): StoredAppEvent {
  const { type, schemaVersion, occurredAt, ...rest } = event as AppEvent & Record<string, unknown>;
  return {
    schemaVersion,
    type,
    occurredAt: occurredAt.toISOString(),
    payload: rest,
  };
}

export class EventStore {
  constructor(
    private readonly driver: StorageDriver,
    private readonly key: string = TELEMETRY_EVENT_LOG_KEY,
  ) {}

  async append(event: AppEvent): Promise<void> {
    const log = (await this.driver.get<StoredAppEvent[]>(this.key)) ?? [];
    log.push(serializeAppEvent(event));
    await this.driver.put(this.key, log);
  }

  async readAll(): Promise<readonly StoredAppEvent[]> {
    return (await this.driver.get<StoredAppEvent[]>(this.key)) ?? [];
  }

  async clear(): Promise<void> {
    await this.driver.remove(this.key);
  }
}
