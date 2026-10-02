/** Block edit feedback and canonical block-state application. */
import { buildingState } from "../state.js";
export function prepareBuildingBlockEdits() {
  buildingState.placedLanternCoordinates = new Set();
}
