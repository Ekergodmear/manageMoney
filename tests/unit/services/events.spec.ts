import { describe, expect, it } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import { createAppServices } from '@/services/registry/app-services';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import type { PlanGeneratedEvent } from '@/services/events/event-types';
import { isAppEvent } from '@/services/events/domain-events';

describe('EventBus', () => {
  it('subscriber receives PlanGenerated', () => {
    const fixed = new Date('2026-06-25T08:00:00.000Z');
    const services = createAppServices({
      clock: new FakeClock(fixed),
      storageDriver: new MemoryStorageDriver(),
      operational: false,
    });

    const received: PlanGeneratedEvent[] = [];
    services.events.subscribe('PlanGenerated', (event) => {
      received.push(event);
    });

    const event = services.events.createEvent('PlanGenerated', {
      sessionId: 'session-1',
      planId: 'plan-a',
    });
    services.events.emit(event);

    expect(received).toHaveLength(1);
    const first = received[0];
    expect(first).toBeDefined();
    if (first === undefined) {
      return;
    }
    expect(first).toMatchObject({
      type: 'PlanGenerated',
      schemaVersion: 1,
      sessionId: 'session-1',
      planId: 'plan-a',
    });
    expect(first.occurredAt.toISOString()).toBe(fixed.toISOString());
  });

  it('does not notify unsubscribed handlers', () => {
    const services = createAppServices({
      storageDriver: new MemoryStorageDriver(),
      operational: false,
    });
    let count = 0;
    const unsubscribe = services.events.subscribe('PlanGenerated', () => {
      count++;
    });
    unsubscribe();
    services.events.emit(
      services.events.createEvent('PlanGenerated', {
        sessionId: 's',
        planId: 'p',
      }),
    );
    expect(count).toBe(0);
  });

  it('isolates handlers by event type', () => {
    const services = createAppServices({
      storageDriver: new MemoryStorageDriver(),
      operational: false,
    });
    let planCount = 0;
    let viewedCount = 0;
    services.events.subscribe('PlanGenerated', () => {
      planCount++;
    });
    services.events.subscribe('PlanningViewed', () => {
      viewedCount++;
    });
    services.events.emit(
      services.events.createEvent('PlanGenerated', { sessionId: 's', planId: 'p' }),
    );
    expect(planCount).toBe(1);
    expect(viewedCount).toBe(0);
  });

  it('isAppEvent validates shape', () => {
    const services = createAppServices({
      storageDriver: new MemoryStorageDriver(),
      operational: false,
    });
    const event = services.events.createEvent('PlanGenerated', {
      sessionId: 's',
      planId: 'p',
    });
    expect(isAppEvent(event)).toBe(true);
    expect(isAppEvent({ type: 'PlanGenerated' })).toBe(false);
  });
});

describe('Milestone 1 DoD — Generate Plan flow', () => {
  it('emit PlanGenerated → subscriber receives (no UI)', () => {
    const services = createAppServices({
      storageDriver: new MemoryStorageDriver(),
      operational: false,
    });
    const audit: string[] = [];

    services.events.subscribe('PlanGenerated', (event) => {
      audit.push(`received:${event.sessionId}:${event.planId}`);
    });

    const sessionId = crypto.randomUUID();
    const planId = crypto.randomUUID();
    services.events.emit(services.events.createEvent('PlanGenerated', { sessionId, planId }));

    expect(audit).toEqual([`received:${sessionId}:${planId}`]);
  });
});
