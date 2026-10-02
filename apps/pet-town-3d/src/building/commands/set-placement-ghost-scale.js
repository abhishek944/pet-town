/** Animated edits, placement constraints, undo/redo and block selection. */
import { buildingState } from "../state.js";
export let setPlacementGhostScale = (scale) => {
  buildingState.placementGhostScale = scale;
};
