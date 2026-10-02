/** Terrain access, solid-block queries and raycast normalization with voxel-grid fallback. */
import { isBuildingBlockSolid } from "./is-building-block-solid.js";
import { buildingState } from "../state.js";
import { readTerrainBlock } from "./read-terrain-block.js";
export function raycastVoxelGrid(origin, direction, maximumDistance) {
  let result = Math.floor(origin.x);
  let result2 = Math.floor(origin.y);
  let result3 = Math.floor(origin.z);
  let signResult = Math.sign(direction.x);
  let signResult2 = Math.sign(direction.y);
  let signResult3 = Math.sign(direction.z);
  let result4 = signResult ? Math.abs(1 / direction.x) : 1 / 0;
  let result5 = signResult2 ? Math.abs(1 / direction.y) : 1 / 0;
  let result6 = signResult3 ? Math.abs(1 / direction.z) : 1 / 0;
  let result7 =
    signResult > 0
      ? (result + 1 - origin.x) * result4
      : signResult < 0
        ? (origin.x - result) * result4
        : 1 / 0;
  let result8 =
    signResult2 > 0
      ? (result2 + 1 - origin.y) * result5
      : signResult2 < 0
        ? (origin.y - result2) * result5
        : 1 / 0;
  let result9 =
    signResult3 > 0
      ? (result3 + 1 - origin.z) * result6
      : signResult3 < 0
        ? (origin.z - result3) * result6
        : 1 / 0;
  let index = 0;
  let index2 = 0;
  let index3 = 0;
  let index4 = 0;
  for (let index5 = 0; index5 < 400 && index4 <= maximumDistance; index5++) {
    if (index5 > 0 && isBuildingBlockSolid(result, result2, result3)) {
      return {
        x: result,
        y: result2,
        z: result3,
        nx: index,
        ny: index2,
        nz: index3,
        dist: index4,
        id: buildingState.buildingRuntime.blockAtWorks
          ? readTerrainBlock(result, result2, result3)
          : 0,
      };
    }
    if (result7 < result8 && result7 < result9) {
      result += signResult;
      index4 = result7;
      result7 += result4;
      index = -signResult;
      index2 = index3 = 0;
    } else {
      if (result8 < result9) {
        result2 += signResult2;
        index4 = result8;
        result8 += result5;
        index2 = -signResult2;
        index = index3 = 0;
      } else {
        result3 += signResult3;
        index4 = result9;
        result9 += result6;
        index3 = -signResult3;
        index = index2 = 0;
      }
    }
  }
  return null;
}
