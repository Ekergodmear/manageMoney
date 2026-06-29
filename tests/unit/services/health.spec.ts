import { describe, expect, it } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import { EventBus } from '@/services/events/domain-events';
import { HealthService } from '@/services/health/health-service';
import { createAppServices } from '@/services/registry/app-services';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';

describe('HealthService', () => {
  it('ignores domain events like PlanGenerated', () => {
    const bus = new EventBus(new FakeClock(new Date('2026-06-01')));
    const health = new HealthService(bus);

    bus.emit(bus.createEvent('PlanGenerated', { sessionId: 's', planId: 'p' }));
    bus.emit(bus.createEvent('PlanningViewed', {}));

    expect(health.getSnapshot().status).toBe('ok');
    health.dispose();
  });

  it('reacts to StorageFailed system event', () => {
    const bus = new EventBus(new FakeClock(new Date('2026-06-01')));
    const health = new HealthService(bus);

    bus.emit(bus.createEvent('StorageFailed', { reason: 'IndexedDB blocked' }));

    const snapshot = health.getSnapshot();
    expect(snapshot.status).toBe('error');
    expect(snapshot.messages).toContain('IndexedDB blocked');
    health.dispose();
  });

  it('returns ok after StorageOpened', async () => {
    const services = createAppServices({ storageDriver: new MemoryStorageDriver() });
    await services.storage.load();
    const snapshot = services.health.getSnapshot();
    expect(snapshot.status).toBe('ok');
    services.telemetry.dispose();
    services.logger.dispose();
    services.health.dispose();
  });
});
