/** IndexedDB key-value storage with timestamp-aware localStorage fallback. */
import { persistenceState } from "../state.js";
import { isPublicTown } from "../../core/runtime-mode.js";
export function preparePersistenceStorage() {
  // Keep the original namespaces so existing worlds and fallback saves remain readable.
  persistenceState.persistenceDatabaseName = isPublicTown ? "pet-town-public" : `bloomvale`;
  persistenceState.persistenceStoreName = `kv`;
  persistenceState.persistenceLocalStoragePrefix = isPublicTown ? "pet-town-public:" : `bloomvale:`;
  persistenceState.persistenceDatabasePromise = null;
}
