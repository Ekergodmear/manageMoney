import type { StorageDriver } from '@/services/storage/StorageDriver';

/** In-memory driver — tests and headless environments only. */
export class MemoryStorageDriver implements StorageDriver {
  private readonly store = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    const value = this.store.get(key);
    return value === undefined ? null : (value as T);
  }

  async put<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
