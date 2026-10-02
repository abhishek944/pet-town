import { openPersistenceDatabase } from "./open-persistence-database.js";
import { persistenceState } from "../state.js";

/** Resolve only after the complete IndexedDB transaction commits. */
export function runPersistenceTransaction(mode, operation) {
  return openPersistenceDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(persistenceState.persistenceStoreName, mode);
        const request = operation(transaction.objectStore(persistenceState.persistenceStoreName));
        transaction.oncomplete = () => resolve(request?.result);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      }),
  );
}
