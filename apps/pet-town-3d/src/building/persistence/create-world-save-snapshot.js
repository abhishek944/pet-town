/** Serialize, save, restore and reset player block changes. */
import { buildingState } from "../state.js";
export let createWorldSaveSnapshot = () => ({
  v: 1,
  sig: buildingState.worldPersistenceState.sig,
  t: Date.now(),
  edits: [...buildingState.worldPersistenceState.edits.values()],
});
