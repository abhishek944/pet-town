/** Terrain access, solid-block queries and raycast normalization with voxel-grid fallback. */
import { resolveTerrainBlockId } from "./resolve-terrain-block-id.js";
import { buildingState } from "../state.js";
export function readTerrainBlock(x, y, z) {
  try {
    return resolveTerrainBlockId(buildingState.buildingTerrain?.blockAt?.(x, y, z));
  } catch {
    return 0;
  }
}
