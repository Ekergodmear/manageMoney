import type { StorageDriver } from '@/services/storage/StorageDriver';

/** In-memory driver — tests and headless environments only. */
export class MemoryStorageDriver implements StorageDriver {
  private readonly store = new Map<string, unknown>();

  get(key: string): Promise<unknown> {
    const value = this.store.get(key);
    return Promise.resolve(value === undefined ? null : value);
  }

  put(key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
    return Promise.resolve();
  }

  remove(key: string): Promise<void> {
    this.store.delete(key);
    return Promise.resolve();
  }

  clear(): void {
    this.store.clear();
  }
}
