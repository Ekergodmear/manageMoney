import type { StorageDriver } from '@/services/storage/StorageDriver';

const DB_NAME = 'stake-planner';
const DB_VERSION = 1;
const STORE = 'kv';

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

export class IndexedDbDriver implements StorageDriver {
  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await openDb();
      return await new Promise<T | null>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const get = tx.objectStore(STORE).get(key);
        get.onerror = () => reject(get.error ?? new Error('IndexedDB get failed'));
        get.onsuccess = () => {
          resolve((get.result as T | undefined) ?? null);
        };
        tx.oncomplete = () => db.close();
      });
    } catch {
      return null;
    }
  }

  async put<T>(key: string, value: T): Promise<void> {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const put = tx.objectStore(STORE).put(value, key);
        put.onerror = () => reject(put.error ?? new Error('IndexedDB put failed'));
        put.onsuccess = () => resolve();
        tx.oncomplete = () => db.close();
      });
    } catch {
      // Offline or private mode — swallow like legacy persistence
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const del = tx.objectStore(STORE).delete(key);
        del.onerror = () => reject(del.error ?? new Error('IndexedDB delete failed'));
        del.onsuccess = () => resolve();
        tx.oncomplete = () => db.close();
      });
    } catch {
      // Offline or private mode
    }
  }
}
