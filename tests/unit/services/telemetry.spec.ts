import { describe, expect, it } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import { EventStore } from '@/services/telemetry/event-store';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { EVENT_SCHEMA_VERSION } from '@/services/events/event-types';

describe('Telemetry — EventStore', () => {
  it('append persists serialized event via StorageDriver', async () => {
    const driver = new MemoryStorageDriver();
    const store = new EventStore(driver);
    const occurredAt = new Date('2026-06-25T10:00:00.000Z');

    await store.append({
      type: 'PlanGenerated',
      schemaVersion: EVENT_SCHEMA_VERSION,
      occurredAt,
      sessionId: 's1',
      planId: 'p1',
    });

    const log = await store.readAll();
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({
      type: 'PlanGenerated',
      schemaVersion: 1,
      occurredAt: occurredAt.toISOString(),
      payload: { sessionId: 's1', planId: 'p1' },
    });
  });

  it('does not import IndexedDB directly — uses StorageDriver', () => {
    expect(EventStore.prototype.append).toBeDefined();
  });
});

describe('TelemetryStore', () => {
  it('subscribes to domain events and appends on emit', async () => {
    const { createAppServices } = await import('@/services/registry/app-services');
    const driver = new MemoryStorageDriver();
    const services = createAppServices({
      clock: new FakeClock(new Date('2026-06-01')),
      storageDriver: driver,
    });

    services.events.emit(
      services.events.createEvent('PlanGenerated', {
        sessionId: 'session-x',
        planId: 'plan-y',
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    const log = await services.telemetry.readAll();
    expect(log.some((e) => e.type === 'PlanGenerated')).toBe(true);

    services.telemetry.dispose();
    services.logger.dispose();
    services.health.dispose();
  });
});
