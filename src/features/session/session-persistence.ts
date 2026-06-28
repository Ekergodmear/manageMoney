import type { PersistedAppState } from '@/features/session/session-types';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';

const DB_NAME = 'stake-planner';
const DB_VERSION = 1;
const STORE = 'kv';
const STATE_KEY = 'app-state';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export async function loadPersistedState(): Promise<PersistedAppState> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const get = tx.objectStore(STORE).get(STATE_KEY);
      get.onerror = () => reject(get.error ?? new Error('IndexedDB get failed'));
      get.onsuccess = () => {
        const raw = get.result as PersistedAppState | undefined;
        if (raw?.version === 1) {
          resolve(raw);
        } else {
          resolve(EMPTY_PERSISTED_STATE);
        }
      };
      tx.oncomplete = () => db.close();
    });
  } catch {
    return EMPTY_PERSISTED_STATE;
  }
}

export async function savePersistedState(state: PersistedAppState): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const put = tx.objectStore(STORE).put(state, STATE_KEY);
      put.onerror = () => reject(put.error ?? new Error('IndexedDB put failed'));
      put.onsuccess = () => resolve();
      tx.oncomplete = () => db.close();
    });
  } catch {
    // Offline or private mode — app still works in memory
  }
}
