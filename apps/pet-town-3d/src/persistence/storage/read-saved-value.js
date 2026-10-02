import { runPersistenceTransaction } from "./run-persistence-transaction.js";
import { readPersistenceFallback } from "./read-persistence-fallback.js";

/** Prefer the newest save when the synchronous fallback contains newer edits. */
export async function readSavedValue(key) {
  let storedRecord;
  try {
    storedRecord = await runPersistenceTransaction("readonly", (store) => store.get(key));
  } catch {
    storedRecord = null;
  }
  const fallbackRecord = readPersistenceFallback(key);
  if (storedRecord && fallbackRecord) {
    return (fallbackRecord.t ?? 0) > (storedRecord.t ?? 0) ? fallbackRecord : storedRecord;
  }
  return storedRecord ?? fallbackRecord ?? null;
}
