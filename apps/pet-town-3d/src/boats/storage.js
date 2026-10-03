import { persistenceState } from "../persistence/state.js";

export function createBoatStorage(report) {
  const key = `${persistenceState.persistenceLocalStoragePrefix}harbor-launch`;
  let available = true,
    saved = null,
    dirty = false;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      saved = JSON.parse(raw);
      if (saved.v !== 1 || ![saved.x, saved.z, saved.yaw].every(Number.isFinite))
        throw new Error("Invalid boat save");
    }
  } catch {
    available = false;
    saved = null;
    report("The boat save could not be read and has been kept. This voyage will not overwrite it.");
  }
  return {
    saved,
    mark() {
      dirty = true;
    },
    save(pose) {
      if (!available || !dirty) return;
      try {
        localStorage.setItem(key, JSON.stringify({ v: 1, x: pose.x, z: pose.z, yaw: pose.yaw }));
        dirty = false;
      } catch {
        report("The boat position could not be saved. You can still enjoy this voyage.");
      }
    },
  };
}
