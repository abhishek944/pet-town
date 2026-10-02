import { persistenceState } from "../state.js";

/** Share one connection attempt; a failed attempt can be retried by the next save. */
export function openPersistenceDatabase() {
  if (!persistenceState.persistenceDatabasePromise) {
    persistenceState.persistenceDatabasePromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(persistenceState.persistenceDatabaseName, 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore(persistenceState.persistenceStoreName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(Error("idb blocked"));
      } catch (error) {
        reject(error);
      }
    });
    persistenceState.persistenceDatabasePromise.catch(() => {
      persistenceState.persistenceDatabasePromise = null;
    });
  }
  return persistenceState.persistenceDatabasePromise;
}
