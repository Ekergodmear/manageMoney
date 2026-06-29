/**
 * Storage abstraction — swap IndexedDB → SQLite/OPFS by changing driver only.
 */
export interface StorageDriver {
  get<T>(key: string): Promise<T | null>;
  put<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}
