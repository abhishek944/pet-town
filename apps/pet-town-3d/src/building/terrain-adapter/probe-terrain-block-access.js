/** Terrain access, solid-block queries and raycast normalization with voxel-grid fallback. */
import { buildingState } from "../state.js";
import { readTerrainBlock } from "./read-terrain-block.js";
export function probeTerrainBlockAccess() {
  if (!buildingState.buildingTerrain?.blockAt) {
    return false;
  }
  let result = buildingState.buildingTerrain.topY ?? buildingState.buildingTerrain.heightAt;
  if (!result) {
    return false;
  }
  for (let [result2, result3] of [
    [0, 0],
    [5, -3],
    [-7, 9],
    [12, 12],
    [-15, -4],
    [2, 3],
  ]) {
    let numberResult = Number(
      result.call(buildingState.buildingTerrain, result2 + 0.5, result3 + 0.5),
    );
    if (Number.isFinite(numberResult)) {
      for (let result4 of [
        Math.floor(numberResult) - 1,
        Math.floor(numberResult),
        Math.floor(numberResult - 0.5),
      ]) {
        if (readTerrainBlock(result2, result4, result3) > 0) {
          return true;
        }
      }
    }
  }
  return false;
}
