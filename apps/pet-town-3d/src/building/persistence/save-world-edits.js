/** Serialize, save, restore and reset player block changes. */
import { buildingState } from "../state.js";
import { writeSavedValue } from "../../persistence/storage/write-saved-value.js";
import { createWorldSaveSnapshot } from "./create-world-save-snapshot.js";
import { flushPendingBlockPlacements } from "../meshes/flush-pending-block-placements.js";
let pendingSave = Promise.resolve("clean");
export function saveWorldEdits() {
  flushPendingBlockPlacements();
  if (buildingState.worldPersistenceState.on && buildingState.worldPersistenceState.dirty) {
    buildingState.worldPersistenceState.dirty = false;
    pendingSave = writeSavedValue(buildingState.worldSaveKey, createWorldSaveSnapshot())
      .then((storage) => {
        if (storage === "none") buildingState.worldPersistenceState.dirty = true;
        return storage;
      })
      .catch(() => {
        buildingState.worldPersistenceState.dirty = true;
        return "none";
      });
  }
  return pendingSave;
}
