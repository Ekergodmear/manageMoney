import type { DomainEventHandler, AppEventHandler, AppEventType } from '@/services/events/event-types';
import type { EventBus } from '@/services/events/domain-events';

export function registerEventSubscriber<T extends AppEventType>(
  bus: EventBus,
  type: T,
  handler: AppEventHandler<T>,
): () => void {
  return bus.subscribe(type, handler);
}

/** @deprecated Use AppEventHandler */
export type { DomainEventHandler };
