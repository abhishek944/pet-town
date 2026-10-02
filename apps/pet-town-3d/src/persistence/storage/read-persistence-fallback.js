/** IndexedDB key-value storage with timestamp-aware localStorage fallback. */
import { persistenceState } from "../state.js";
export let readPersistenceFallback = (key) => {
  try {
    let itemResult = localStorage.getItem(persistenceState.persistenceLocalStoragePrefix + key);
    return itemResult ? JSON.parse(itemResult) : null;
  } catch {
    return null;
  }
};
