/** Selection and preview meshes, skinned block instances, debris and block animations. */
import { buildingState } from "../state.js";
import { applyBuildingBlockState } from "../block-edits/apply-building-block-state.js";
export function flushPendingBlockPlacements() {
  for (let position of buildingState.pendingBlockPlacements.splice(0)) {
    applyBuildingBlockState(position.x, position.y, position.z, position.state);
  }
}
