/** IndexedDB key-value storage with timestamp-aware localStorage fallback. */
import { persistenceState } from "../state.js";
export let deletePersistenceFallback = (key) => {
  try {
    localStorage.removeItem(persistenceState.persistenceLocalStoragePrefix + key);
  } catch {}
};
