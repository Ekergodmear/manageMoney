/**
 * Storage abstraction — swap IndexedDB → SQLite/OPFS by changing driver only.
 */
export interface StorageDriver {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
}
