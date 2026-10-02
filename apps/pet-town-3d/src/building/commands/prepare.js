/** Animated edits, placement constraints, undo/redo and block selection. */
import { buildingState } from "../state.js";
export function prepareBuildingCommands() {
  buildingState.placementGhostScale = 1;
  buildingState.placementDeniedShake = 0;
}
