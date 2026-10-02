/** IndexedDB key-value storage with timestamp-aware localStorage fallback. */
import { deletePersistenceFallback } from "./delete-persistence-fallback.js";
import { runPersistenceTransaction } from "./run-persistence-transaction.js";
export async function deleteSavedValue(key) {
  deletePersistenceFallback(key);
  try {
    await runPersistenceTransaction(`readwrite`, (store) => store.delete(key));
  } catch {}
}
