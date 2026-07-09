import { describe, expect, it, vi, afterEach } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import { EventBus } from '@/services/events/domain-events';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';
import { PersistenceHealthMonitor } from '@/services/storage/persistence-health';
import { buildPersistenceSnapshot } from '@/services/storage/persistence-snapshot';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { PersistenceService } from '@/services/storage/PersistenceService';
import { APP_STATE_STORAGE_KEY } from '@/services/storage/repositories/app-state-repository';
import { classifyStorageErrorMessage, formatStorageErrorCause } from '@/services/storage/storage-errors';
import { refreshPersistenceCapability } from '@/product-shell/ui/diagnostics/persistence-capability';
import {
  createAppServices,
  resetAppServicesForTests,
} from '@/services/registry/app-services';
import { IndexedDbDriver } from '@/services/storage/IndexedDbDriver';
import { createDiagnosticCapabilities } from '@/product-shell/ui/diagnostics/create-capabilities';
import { createAppDiagnosticsPorts } from '@/product-shell/ui/diagnostics/app-diagnostics-ports';

describe('R2.4 — Persistence Observability', () => {
  afterEach(() => {
    resetAppServicesForTests();
    vi.restoreAllMocks();
  });

  describe('storage-errors taxonomy', () => {
    it('maps known failure messages to operator-facing causes', () => {
      expect(classifyStorageErrorMessage('IndexedDB open failed')).toBe('storage_open_failed');
      expect(classifyStorageErrorMessage('migration failed: corrupt payload')).toBe(
        'migration_failed',
      );
      expect(classifyStorageErrorMessage('QuotaExceededError')).toBe('quota_exceeded');
      expect(formatStorageErrorCause('indexeddb_unavailable')).toBe('IndexedDB Unavailable');
    });
  });

  describe('Case 1: IndexedDB unavailable → Offline', () => {
    it('reports offline when IndexedDB probe fails', async () => {
      vi.stubGlobal('indexedDB', undefined);

      const health = new PersistenceHealthMonitor(
        new EventBus(new FakeClock(new Date('2026-06-30T00:00:00.000Z'))),
        new FakeClock(new Date('2026-06-30T00:00:00.000Z')),
      );
      const snapshot = await buildPersistenceSnapshot({
        driver: new IndexedDbDriver(),
        health: health.getView(),
        checkedAt: '2026-06-30T00:00:00.000Z',
      });

      expect(snapshot.status).toBe('offline');
      expect(snapshot.driverLabel).toBe('IndexedDB');
      health.dispose();
      vi.unstubAllGlobals();
    });
  });

  describe('Case 2: migration failed → Critical', () => {
    it('surfaces migration failure in health and diagnostic snapshot', async () => {
      const clock = new FakeClock(new Date('2026-06-30T00:00:00.000Z'));
      const bus = new EventBus(clock);
      const health = new PersistenceHealthMonitor(bus, clock);

      bus.emit(bus.createEvent('StorageFailed', { reason: 'migration failed: invalid version' }));

      const view = health.getView();
      expect(view.status).toBe('critical');
      expect(view.lastMigration?.status).toBe('failed');
      expect(view.lastError?.cause).toBe('migration_failed');

      const diagnostic = await buildPersistenceSnapshot({
        driver: new MemoryStorageDriver(),
        health: view,
        checkedAt: '2026-06-30T00:00:00.000Z',
      });
      expect(diagnostic.status).toBe('critical');
      health.dispose();
    });
  });

  describe('Case 3: successful save updates Last Save', () => {
    it('records StorageSaved on persistence service save', async () => {
      const clock = new FakeClock(new Date('2026-06-30T12:00:00.000Z'));
      const bus = new EventBus(clock);
      const health = new PersistenceHealthMonitor(bus, clock);
      const storage = new PersistenceService(new MemoryStorageDriver(), bus);

      await storage.save({ ...EMPTY_PERSISTED_STATE, nextSessionNumber: 9 });

      expect(health.getView().lastSaveAt).toBe('2026-06-30T12:00:00.000Z');
      health.dispose();
    });
  });

  describe('Case 4: Diagnostics refresh', () => {
    it('refreshes persistence capability through diagnostics ports', async () => {
      const services = createAppServices({
        storageDriver: new MemoryStorageDriver(),
        clock: new FakeClock(new Date('2026-06-30T00:00:00.000Z')),
      });
      resetAppServicesForTests(services);

      const driver = services.storageDriver as MemoryStorageDriver;
      await driver.put(APP_STATE_STORAGE_KEY, {
        ...EMPTY_PERSISTED_STATE,
        nextSessionNumber: 4,
      });
      await services.storage.load();
      await services.storage.save({ ...EMPTY_PERSISTED_STATE, nextSessionNumber: 5 });

      const capabilities = createDiagnosticCapabilities(
        createAppDiagnosticsPorts({
          fetchCollectorHealth: () => Promise.resolve(null),
          notificationCount: 0,
          unreadNotificationCount: 0,
          statisticsError: null,
          statisticsLoading: false,
          statisticsDrawCount: null,
          cloudEnabled: false,
          buildVersion: 'test',
          runtimeHealthy: true,
        }),
      );

      const storageCapability = capabilities.find((entry) => entry.id === 'storage');
      expect(storageCapability).toBeDefined();
      if (storageCapability === undefined) {
        return;
      }

      const snapshot = await storageCapability.refresh();
      expect(snapshot.rows.some((row) => row.label === 'Schema Version' && row.value === '6')).toBe(
        true,
      );
      expect(snapshot.rows.some((row) => row.label === 'Last Save' && row.value !== '—')).toBe(
        true,
      );
      expect(snapshot.summary).toContain('schema v6');

      services.telemetry.dispose();
      services.logger.dispose();
      services.health.dispose();
      services.persistenceHealth.dispose();
    });

    it('refreshPersistenceCapability returns structured rows without repository imports in UI layer', async () => {
      const services = createAppServices({ storageDriver: new MemoryStorageDriver() });
      resetAppServicesForTests(services);

      const snapshot = await refreshPersistenceCapability(services);
      expect(snapshot.rows.map((row) => row.label)).toEqual([
        'Status',
        'Storage Driver',
        'Schema Version',
        'Last Migration',
        'Last Save',
        'Last Load',
        'Last Error',
        'Sessions',
        'Drafts',
        'Candidates',
        'Library Collections',
        'Notifications',
        'Storage Size',
      ]);

      services.telemetry.dispose();
      services.logger.dispose();
      services.health.dispose();
      services.persistenceHealth.dispose();
    });
  });
});
