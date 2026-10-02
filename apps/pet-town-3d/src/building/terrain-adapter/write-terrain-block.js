/** Terrain access, solid-block queries and raycast normalization with voxel-grid fallback. */
import { buildingState } from "../state.js";
export function writeTerrainBlock(x, y, z, blockId) {
  try {
    buildingState.buildingTerrain?.setBlock?.(x, y, z, blockId);
  } catch (result) {
    console.warn(`[building] setBlock failed`, result);
  }
}
