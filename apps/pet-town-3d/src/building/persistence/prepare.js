/** Serialize, save, restore and reset player block changes. */
import { buildingState } from "../state.js";
export function prepareBuildingPersistence() {
  buildingState.worldPersistenceState = {
    on: false,
    replaying: false,
    edits: new Map(),
    dirty: false,
    timer: 0,
    loaded: false,
    restoreGeneration: 0,
    restored: 0,
    sig: ``,
  };
  buildingState.worldSaveKey = `world-v1`;
}
