import type { PersistedAppState } from '@/features/session/session-types';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';
import { migratePersistedState } from '@/services/storage/migrations';
import type { StorageDriver } from '@/services/storage/StorageDriver';

export const APP_STATE_STORAGE_KEY = 'app-state';

export interface AppStateLoadResult {
  readonly state: PersistedAppState;
  readonly migratedFrom: number | null;
}

export class AppStateRepository {
  constructor(private readonly driver: StorageDriver) {}

  async loadWithMeta(): Promise<AppStateLoadResult> {
    const raw = await this.driver.get(APP_STATE_STORAGE_KEY);
    if (raw === null || typeof raw !== 'object') {
      return { state: EMPTY_PERSISTED_STATE, migratedFrom: null };
    }
    const beforeVersion =
      'version' in raw ? Number((raw as { version?: number }).version) : null;
    const state = migratePersistedState(raw);
    const migratedFrom =
      beforeVersion !== null && !Number.isNaN(beforeVersion) && beforeVersion !== state.version
        ? beforeVersion
        : null;
    return { state, migratedFrom };
  }

  async load(): Promise<PersistedAppState> {
    const { state } = await this.loadWithMeta();
    return state;
  }

  async save(state: PersistedAppState): Promise<void> {
    await this.driver.put(APP_STATE_STORAGE_KEY, state);
  }
}
