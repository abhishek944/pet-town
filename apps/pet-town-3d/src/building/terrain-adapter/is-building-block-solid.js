/** Terrain access, solid-block queries and raycast normalization with voxel-grid fallback. */
import { buildingState } from "../state.js";
import { readTerrainBlock } from "./read-terrain-block.js";
export function isBuildingBlockSolid(x, y, z) {
  if (buildingState.buildingRuntime.blockAtWorks) {
    let terrainBlockResult = readTerrainBlock(x, y, z);
    return (
      terrainBlockResult > 0 &&
      terrainBlockResult !== buildingState.buildingRuntime.airId &&
      !buildingState.buildingRuntime.nonSolid.has(terrainBlockResult)
    );
  }
  let result = (
    buildingState.buildingTerrain?.topY ?? buildingState.buildingTerrain?.heightAt
  )?.call(buildingState.buildingTerrain, x + 0.5, z + 0.5);
  return y >= 0 && Number.isFinite(result) && y < result;
}
