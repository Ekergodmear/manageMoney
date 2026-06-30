import type { Clock } from '@/services/clock/clock';
import type {
  AppEvent,
  AppEventHandler,
  AppEventOf,
  AppEventType,
  Unsubscribe,
} from '@/services/events/event-types';
import { EVENT_SCHEMA_VERSION } from '@/services/events/event-types';

export class EventBus {
  private readonly handlers = new Map<AppEventType, Set<(event: AppEvent) => void>>();

  constructor(private readonly clock: Clock) {}

  subscribe<T extends AppEventType>(type: T, handler: AppEventHandler<T>): Unsubscribe {
    let set = this.handlers.get(type);
    if (set === undefined) {
      set = new Set();
      this.handlers.set(type, set);
    }
    const listener = handler as (event: AppEvent) => void;
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }

  /** Logger — subscribe mọi event type trong catalog */
  subscribeLogger(handler: (event: AppEvent) => void, types: readonly AppEventType[]): Unsubscribe {
    const unsubscribes = types.map((type) =>
      this.subscribe(type, handler as AppEventHandler<typeof type>),
    );
    return () => {
      for (const unsub of unsubscribes) {
        unsub();
      }
    };
  }

  emit<T extends AppEventType>(event: AppEventOf<T>): void {
    const set = this.handlers.get(event.type);
    if (set === undefined) {
      return;
    }
    for (const handler of set) {
      handler(event);
    }
  }

  createEvent<T extends AppEventType>(
    type: T,
    payload: Omit<AppEventOf<T>, 'type' | 'schemaVersion' | 'occurredAt'>,
  ): AppEventOf<T> {
    return {
      type,
      schemaVersion: EVENT_SCHEMA_VERSION,
      occurredAt: this.clock.now(),
      ...payload,
    } as AppEventOf<T>;
  }

  clearSubscribers(): void {
    this.handlers.clear();
  }
}

/** @deprecated Alias — prefer EventBus */
export const DomainEventBus = EventBus;

export function isAppEvent(value: unknown): value is AppEvent {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.type === 'string' &&
    record.schemaVersion === EVENT_SCHEMA_VERSION &&
    record.occurredAt instanceof Date
  );
}

/** @deprecated Use isAppEvent */
export const isDomainEvent = isAppEvent;
