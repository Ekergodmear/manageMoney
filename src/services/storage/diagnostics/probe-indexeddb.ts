const DB_NAME = 'stake-planner';
const DB_VERSION = 1;

export async function probeIndexedDbAvailability(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') {
    return false;
  }
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      resolve(false);
    };
    request.onsuccess = () => {
      request.result.close();
      resolve(true);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv');
      }
    };
  });
}
