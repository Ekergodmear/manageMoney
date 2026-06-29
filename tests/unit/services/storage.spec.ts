import { describe, expect, it } from 'vitest';

import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { PersistenceService } from '@/services/storage/PersistenceService';
import { APP_STATE_STORAGE_KEY } from '@/services/storage/repositories/app-state-repository';

describe('Storage — PersistenceService', () => {
  it('load returns empty state when key missing', async () => {
    const driver = new MemoryStorageDriver();
    const storage = new PersistenceService(driver);
    const state = await storage.load();
    expect(state).toEqual(EMPTY_PERSISTED_STATE);
  });

  it('save and load round-trip', async () => {
    const driver = new MemoryStorageDriver();
    const storage = new PersistenceService(driver);
    const saved = {
      ...EMPTY_PERSISTED_STATE,
      nextSessionNumber: 42,
    };
    await storage.save(saved);
    const loaded = await storage.load();
    expect(loaded.nextSessionNumber).toBe(42);
  });

  it('uses APP_STATE_STORAGE_KEY in driver', async () => {
    const driver = new MemoryStorageDriver();
    const storage = new PersistenceService(driver);
    await storage.save({ ...EMPTY_PERSISTED_STATE, theme: 'dark' });
    const raw = await driver.get<typeof EMPTY_PERSISTED_STATE>(APP_STATE_STORAGE_KEY);
    expect(raw?.theme).toBe('dark');
  });

  it('migrates legacy v2 shape on load', async () => {
    const driver = new MemoryStorageDriver();
    await driver.put(APP_STATE_STORAGE_KEY, {
      version: 2,
      theme: 'light',
      nextSessionNumber: 1,
      activeSession: null,
      history: [],
      customGamePresets: [],
      activePresetId: 'bingo-120',
    });
    const storage = new PersistenceService(driver);
    const state = await storage.load();
    expect(state.version).toBe(3);
    expect(state.sessions).toEqual([]);
  });
});
