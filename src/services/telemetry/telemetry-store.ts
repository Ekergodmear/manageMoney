import type { AppEvent, AppEventType } from '@/services/events/event-types';
import { TELEMETRY_EVENT_TYPES } from '@/services/events/event-types';
import type { EventBus } from '@/services/events/domain-events';
import type { EventStore } from '@/services/telemetry/event-store';
import type { StoredAppEvent } from '@/services/telemetry/event-store';

export interface TelemetryStoreOptions {
  readonly enabled?: boolean;
}

/**
 * Telemetry — append từng event vào EventStore (IndexedDB qua StorageDriver).
 * Batch flush là optimization sau — không bắt buộc M2.
 */
export class TelemetryStore {
  private readonly unsubscribes: (() => void)[] = [];
  private readonly enabled: boolean;

  constructor(
    private readonly eventStore: EventStore,
    _bus: EventBus,
    options: TelemetryStoreOptions = {},
    eventTypes: readonly AppEventType[] = TELEMETRY_EVENT_TYPES,
  ) {
    this.enabled = options.enabled ?? true;
    for (const type of eventTypes) {
      this.unsubscribes.push(
        _bus.subscribe(type, (event) => {
          if (!this.enabled) {
            return;
          }
          void this.append(event);
        }),
      );
    }
  }

  append(event: AppEvent): Promise<void> {
    return this.eventStore.append(event);
  }

  readAll(): Promise<readonly StoredAppEvent[]> {
    return this.eventStore.readAll();
  }

  dispose(): void {
    for (const unsub of this.unsubscribes) {
      unsub();
    }
    this.unsubscribes.length = 0;
  }
}
