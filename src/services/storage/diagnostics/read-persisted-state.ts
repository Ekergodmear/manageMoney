import type { PersistedAppState } from '@/features/session/session-types';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';
import { migratePersistedState } from '@/services/storage/migrate-persisted-state';
import { APP_STATE_STORAGE_KEY } from '@/services/storage/repositories/app-state-repository';
import type { StorageDriver } from '@/services/storage/StorageDriver';

/** Read-only diagnostics load — does not emit persistence events. */
export async function readPersistedStateForDiagnostics(
  driver: StorageDriver,
): Promise<PersistedAppState> {
  try {
    const raw = await driver.get(APP_STATE_STORAGE_KEY);
    if (raw === null || typeof raw !== 'object') {
      return EMPTY_PERSISTED_STATE;
    }
    return migratePersistedState(raw);
  } catch {
    return EMPTY_PERSISTED_STATE;
  }
}
