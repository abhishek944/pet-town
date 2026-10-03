import { persistenceState } from "../../persistence/state.js";
import { COAST_SHELLS, SHELLHAVEN_PLACES } from "./places.js";

export function createShellhavenProgress(report) {
  const key = `${persistenceState.persistenceLocalStoragePrefix}shellhaven-trail`;
  let state = { v: 1, stamps: [], shells: [], favorite: null };
  let available = true;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved?.v !== 1 || !Array.isArray(saved.stamps) || !Array.isArray(saved.shells))
        throw new Error("Unreadable Shellhaven progress");
      const shells = COAST_SHELLS.map((shell) => shell.id).filter((id) =>
        saved.shells.includes(id),
      );
      state = {
        v: 1,
        shells,
        stamps: SHELLHAVEN_PLACES.map((place) => place.id).filter((id) =>
          saved.stamps.includes(id),
        ),
        favorite: shells.includes(saved.favorite) ? saved.favorite : null,
      };
    }
  } catch {
    available = false;
    report(
      "Shellhaven progress could not be read. Existing progress has been kept. Reload after checking device storage.",
    );
  }
  function save(next) {
    if (!available) return false;
    try {
      localStorage.setItem(key, JSON.stringify(next));
      state = next;
      return true;
    } catch {
      report(
        "Your shell collection could not be saved. Check device storage and try again; no progress has changed.",
      );
      return false;
    }
  }
  return {
    get state() {
      return state;
    },
    get available() {
      return available;
    },
    stamp(id) {
      return (
        SHELLHAVEN_PLACES.some((place) => place.id === id) &&
        (state.stamps.includes(id) || save({ ...state, stamps: [...state.stamps, id] }))
      );
    },
    collect(id) {
      return (
        COAST_SHELLS.some((shell) => shell.id === id) &&
        !state.shells.includes(id) &&
        save({ ...state, shells: [...state.shells, id], favorite: state.favorite ?? id })
      );
    },
    feature(id) {
      return state.shells.includes(id) && save({ ...state, favorite: id });
    },
  };
}
