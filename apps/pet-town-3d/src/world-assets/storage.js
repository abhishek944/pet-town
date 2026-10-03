import { validAssetBaseLayout } from "./base-layout.js";
import { persistenceState } from "../persistence/state.js";

const stores = new Map();
const emptyState = () => ({ v: 1, additions: [], replacements: [] });
const finitePosition = (item) => [item.x, item.z, item.rot].every(Number.isFinite);
function validItem(item, replacement) {
  return (
    item &&
    typeof item.assetId === "string" &&
    finitePosition(item) &&
    typeof (replacement ? item.key : item.id) === "string" &&
    Math.abs(item.x) < 4096 &&
    Math.abs(item.z) < 4096 &&
    Math.abs(item.rot) < Math.PI * 100
  );
}

/** A failed read never permits a write that would erase the unreadable record. */
export function getWorldAssetStore() {
  const key = `${persistenceState.persistenceLocalStoragePrefix}world-assets`;
  if (stores.has(key)) return stores.get(key);
  let state = emptyState();
  let error = "";
  let readable = true;
  const history = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      if (raw.length > 1_000_000) throw new Error("Asset edit record is too large");
      const parsed = JSON.parse(raw);
      if (
        parsed?.v !== 1 ||
        (parsed.base !== undefined && !validAssetBaseLayout(parsed.base)) ||
        !Array.isArray(parsed.additions) ||
        !Array.isArray(parsed.replacements) ||
        parsed.additions.length + parsed.replacements.length > 128 ||
        !parsed.additions.every((item) => validItem(item, false)) ||
        !parsed.replacements.every((item) => validItem(item, true)) ||
        new Set(parsed.additions.map((item) => item.id)).size !== parsed.additions.length ||
        new Set(parsed.replacements.map((item) => item.key)).size !== parsed.replacements.length
      )
        throw new Error("Unreadable asset edits");
      state = parsed;
    }
  } catch {
    readable = false;
    error =
      "Your asset edits could not be read. Reload after checking storage; the saved record has been kept.";
  }
  function write(next) {
    if (!readable) return false;
    try {
      if (next.base !== undefined && !validAssetBaseLayout(next.base))
        throw new Error("Invalid anchored layout");
      const serialized = JSON.stringify(next);
      if (serialized.length > 1_000_000) throw new Error("Asset edit record is too large");
      localStorage.setItem(key, serialized);
      state = next;
      error = "";
      return true;
    } catch {
      error = "Asset edits could not be saved. Please check storage and try again.";
      return false;
    }
  }
  const store = {
    get state() {
      return state;
    },
    get error() {
      return error;
    },
    get available() {
      return readable;
    },
    get canUndo() {
      return history.length > 0;
    },
    save(next) {
      if (next.additions.length + next.replacements.length > 128) {
        error = "Your asset library can hold 128 placed or replaced objects.";
        return false;
      }
      const previous = state;
      if (!write(next)) return false;
      history.push(previous);
      if (history.length > 30) history.shift();
      return true;
    },
    undo() {
      if (!history.length || !write(history.at(-1))) return false;
      history.pop();
      return true;
    },
  };
  stores.set(key, store);
  return store;
}
