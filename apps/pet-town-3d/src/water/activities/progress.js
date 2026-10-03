import { persistenceState } from "../../persistence/state.js";
import { OCEAN_PLACES } from "../layout.js";

export function createOceanProgress(report) {
  const key = `${persistenceState.persistenceLocalStoragePrefix}ocean-discoveries`;
  let state = { v: 1, stamps: [] };
  let available = true;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved?.v !== 1 || !Array.isArray(saved.stamps))
        throw new Error("Unreadable ocean progress");
      state.stamps = OCEAN_PLACES.map((place) => place.id).filter((id) =>
        saved.stamps.includes(id),
      );
    }
  } catch {
    available = false;
    report(
      "Ocean discoveries could not be read. Existing progress has been kept; check storage and reload.",
    );
  }
  return {
    get state() {
      return state;
    },
    get available() {
      return available;
    },
    stamp(id) {
      if (!available || !OCEAN_PLACES.some((place) => place.id === id)) return false;
      if (state.stamps.includes(id)) return true;
      const next = { ...state, stamps: [...state.stamps, id] };
      try {
        localStorage.setItem(key, JSON.stringify(next));
        state = next;
        report("");
        return true;
      } catch {
        report(
          "Ocean discoveries could not be saved. Check storage; you can still explore freely.",
        );
        return false;
      }
    },
  };
}
