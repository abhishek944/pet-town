/** IndexedDB key-value storage with timestamp-aware localStorage fallback. */
import { persistenceState } from "../state.js";
export let writePersistenceFallback = (key, record) => {
  try {
    localStorage.setItem(
      persistenceState.persistenceLocalStoragePrefix + key,
      JSON.stringify(record),
    );
    return true;
  } catch {
    return false;
  }
};
