import type { SystemEvent, SystemEventType } from '@/services/events/event-types';
import { HEALTH_EVENT_TYPES } from '@/services/events/event-types';
import type { EventBus } from '@/services/events/domain-events';

export type HealthStatus = 'ok' | 'warning' | 'error';

export interface HealthSnapshot {
  readonly status: HealthStatus;
  readonly messages: readonly string[];
  readonly updatedAt: Date;
}

const ERROR_SYSTEM_TYPES = new Set<SystemEventType>([
  'StorageFailed',
  'TelemetryFlushFailed',
  'SyncFailed',
]);

const WARNING_SYSTEM_TYPES = new Set<SystemEventType>(['SyncStarted']);

/**
 * Health — chỉ subscribe system events quan trọng.
 * Không quan tâm PlanningViewed hay PlanGenerated.
 */
export class HealthService {
  private status: HealthStatus = 'ok';
  private readonly messages: string[] = [];
  private updatedAt: Date;
  private readonly unsubscribes: (() => void)[] = [];

  constructor(bus: EventBus, eventTypes: readonly SystemEventType[] = HEALTH_EVENT_TYPES) {
    this.updatedAt = new Date();
    for (const type of eventTypes) {
      this.unsubscribes.push(
        bus.subscribe(type, (event) => {
          this.handleSystemEvent(event);
        }),
      );
    }
  }

  getSnapshot(): HealthSnapshot {
    return {
      status: this.status,
      messages: [...this.messages],
      updatedAt: this.updatedAt,
    };
  }

  private handleSystemEvent(event: SystemEvent): void {
    this.updatedAt = event.occurredAt;
    if (ERROR_SYSTEM_TYPES.has(event.type)) {
      this.status = 'error';
      const reason =
        'reason' in event && typeof event.reason === 'string' ? event.reason : event.type;
      this.messages.push(reason);
      return;
    }
    if (WARNING_SYSTEM_TYPES.has(event.type)) {
      if (this.status === 'ok') {
        this.status = 'warning';
      }
      this.messages.push(event.type);
      return;
    }
    if (event.type === 'StorageOpened' || event.type === 'MigrationCompleted') {
      if (this.status === 'error') {
        return;
      }
      this.status = 'ok';
    }
  }

  dispose(): void {
    for (const unsub of this.unsubscribes) {
      unsub();
    }
    this.unsubscribes.length = 0;
  }
}
