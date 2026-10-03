import { persistenceState } from "../../persistence/state.js";
import { FISH_SPECIES, WILLOWMERE_PLACES, WISH_CHOICES } from "./places.js";
import { SHELLHAVEN_PLACES } from "../shellhaven/places.js";

/** Willowmere is independent of the unchanged Sunmeadow v1 save. */
export function createWillowmereProgress(report) {
  const key = `${persistenceState.persistenceLocalStoragePrefix}willowmere-trail`;
  let state = { v: 1, stamps: [], fish: [], catches: 0, lanterns: [] };
  let available = true;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      if (
        saved?.v !== 1 ||
        !Array.isArray(saved.stamps) ||
        !Array.isArray(saved.fish) ||
        !Array.isArray(saved.lanterns) ||
        !Number.isSafeInteger(saved.catches) ||
        saved.catches < 0
      )
        throw new Error("Unreadable Willowmere progress");
      state = {
        v: 1,
        stamps: WILLOWMERE_PLACES.map((place) => place.id).filter((id) =>
          saved.stamps.includes(id),
        ),
        fish: FISH_SPECIES.filter((name) => saved.fish.includes(name)),
        catches: saved.catches,
        lanterns: saved.lanterns.filter((wish) => WISH_CHOICES.includes(wish)).slice(0, 8),
      };
    }
  } catch {
    available = false;
    report(
      "Willowmere progress could not be read. Existing progress has been kept. Reload after checking device storage.",
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
        "Your Willowmere discovery could not be saved. Check device storage and try again; no progress has changed.",
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
      return state.stamps.includes(id) || save({ ...state, stamps: [...state.stamps, id] });
    },
    catchFish(name) {
      return save({
        ...state,
        fish: [...new Set([...state.fish, name])],
        catches: state.catches + 1,
      });
    },
    hang(wish) {
      return (
        WISH_CHOICES.includes(wish) &&
        state.lanterns.length < 8 &&
        save({ ...state, lanterns: [...state.lanterns, wish] })
      );
    },
  };
}

export function combineTrailProgress(sunmeadow, willowmere, shellhaven) {
  return {
    get state() {
      return {
        garden: sunmeadow.state.garden,
        stamps: [
          ...sunmeadow.state.stamps,
          ...(willowmere?.state.stamps ?? []),
          ...(shellhaven?.state.stamps ?? []),
        ],
      };
    },
    get available() {
      return (
        sunmeadow.available || Boolean(willowmere?.available) || Boolean(shellhaven?.available)
      );
    },
    get gardenAvailable() {
      return sunmeadow.available;
    },
    stamp(id) {
      if (SHELLHAVEN_PLACES.some((place) => place.id === id)) return shellhaven?.stamp(id);
      return WILLOWMERE_PLACES.some((place) => place.id === id)
        ? willowmere?.stamp(id)
        : sunmeadow.stamp(id);
    },
    grow() {
      return sunmeadow.grow();
    },
  };
}
