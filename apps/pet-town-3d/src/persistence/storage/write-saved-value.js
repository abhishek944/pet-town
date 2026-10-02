import { runPersistenceTransaction } from "./run-persistence-transaction.js";
import { deletePersistenceFallback } from "./delete-persistence-fallback.js";
import { readPersistenceFallback } from "./read-persistence-fallback.js";
import { writePersistenceFallback } from "./write-persistence-fallback.js";

/** Keep a synchronous copy until IndexedDB commits, including during page reload. */
export async function writeSavedValue(key, record) {
  const mirrored = writePersistenceFallback(key, record);
  try {
    await runPersistenceTransaction("readwrite", (store) => store.put(record, key));
    // An older transaction must not erase a newer in-flight save's fallback.
    if (JSON.stringify(readPersistenceFallback(key)) === JSON.stringify(record)) {
      deletePersistenceFallback(key);
    }
    return "idb";
  } catch {
    return mirrored ? "ls" : "none";
  }
}
