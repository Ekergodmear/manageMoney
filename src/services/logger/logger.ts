import type { AppEvent, AppEventType } from '@/services/events/event-types';
import { TELEMETRY_EVENT_TYPES } from '@/services/events/event-types';
import type { EventBus } from '@/services/events/domain-events';
import type { LogSink } from '@/services/logger/sinks/log-sink';

const ERROR_EVENT_TYPES = new Set<AppEventType>([
  'StorageFailed',
  'TelemetryFlushFailed',
  'SyncFailed',
]);

/**
 * Logger — không gọi console trực tiếp; ghi qua sinks.
 * Nghe tất cả events (domain + system).
 */
export class Logger {
  private readonly unsubscribes: (() => void)[] = [];

  constructor(
    bus: EventBus,
    private readonly sinks: readonly LogSink[],
    eventTypes: readonly AppEventType[] = TELEMETRY_EVENT_TYPES,
  ) {
    this.unsubscribes.push(
      bus.subscribeLogger((event) => {
        this.log(event);
      }, eventTypes),
    );
  }

  log(event: AppEvent, message?: string): void {
    const level = ERROR_EVENT_TYPES.has(event.type) ? 'error' : 'info';
    const entry = {
      level,
      message: message ?? event.type,
      event,
    } as const;
    for (const sink of this.sinks) {
      sink.write(entry);
    }
  }

  dispose(): void {
    for (const unsub of this.unsubscribes) {
      unsub();
    }
    this.unsubscribes.length = 0;
  }
}
