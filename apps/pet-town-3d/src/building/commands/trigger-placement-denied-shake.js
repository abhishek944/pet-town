/** Animated edits, placement constraints, undo/redo and block selection. */
import { buildingState } from "../state.js";
export let triggerPlacementDeniedShake = () => {
  buildingState.placementDeniedShake = 1;
};
