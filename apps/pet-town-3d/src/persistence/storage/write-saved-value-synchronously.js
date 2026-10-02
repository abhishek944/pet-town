/** IndexedDB key-value storage with timestamp-aware localStorage fallback. */
import { writePersistenceFallback } from "./write-persistence-fallback.js";
export function writeSavedValueSynchronously(key, record) {
  return writePersistenceFallback(key, record);
}
