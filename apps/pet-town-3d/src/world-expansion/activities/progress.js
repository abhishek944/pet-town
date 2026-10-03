import { persistenceState } from "../../persistence/state.js";
import { SUNMEADOW_PLACES } from "./places.js";

/** Save before applying a stamp or growth change; never silently lose progress. */
export function createTrailProgress(report) {
  const key = `${persistenceState.persistenceLocalStoragePrefix}sunmeadow-trail`;
  let state = { v: 1, stamps: [], garden: 0 };
  let readFailed = false;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved?.v !== 1 || !Array.isArray(saved.stamps) || !Number.isInteger(saved.garden))
        throw new Error("Unreadable trail progress");
      state = {
        v: 1,
        stamps: SUNMEADOW_PLACES.map((place) => place.id).filter((id) => saved.stamps.includes(id)),
        garden: Math.max(0, Math.min(3, saved.garden)),
      };
    }
  } catch {
    readFailed = true;
    report(
      "Trail progress could not be read. Reload after checking storage; existing progress has been kept.",
    );
  }
  function save(next) {
    if (readFailed) return false;
    try {
      localStorage.setItem(key, JSON.stringify(next));
      state = next;
      return true;
    } catch {
      report(
        "Trail progress could not be saved on this device. Please check available storage and try again.",
      );
      return false;
    }
  }
  return {
    get state() {
      return state;
    },
    get available() {
      return !readFailed;
    },
    stamp(id) {
      return state.stamps.includes(id) || save({ ...state, stamps: [...state.stamps, id] });
    },
    grow() {
      return state.garden < 3 && save({ ...state, garden: state.garden + 1 });
    },
  };
}
