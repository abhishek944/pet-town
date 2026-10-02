/** Animated edits, placement constraints, undo/redo and block selection. */
import { buildingState } from "../state.js";
export function isBlockWithinWorldBounds(x, y, z) {
  let result = (buildingState.buildingTerrain?.size ?? 1e9) / 2;
  let result2 =
    buildingState.buildingTerrain?.height ?? buildingState.buildingTerrain?.maxHeight ?? 256;
  return x >= -result && x < result && z >= -result && z < result && y >= 0 && y < result2;
}
