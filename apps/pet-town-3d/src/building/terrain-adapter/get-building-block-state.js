/** Terrain access, solid-block queries and raycast normalization with voxel-grid fallback. */
import { readTerrainBlock } from "./read-terrain-block.js";
import { buildingState } from "../state.js";
import { blockCoordinateKey } from "../state/block-coordinate-key.js";
export function getBuildingBlockState(x, y, z) {
  let terrainBlockResult = readTerrainBlock(x, y, z);
  let result = buildingState.blockSkinAssignments.get(blockCoordinateKey(x, y, z));
  return {
    id: terrainBlockResult,
    skin: result && result.proxyId === terrainBlockResult ? result.key : null,
  };
}
