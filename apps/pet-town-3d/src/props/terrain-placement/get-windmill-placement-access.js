/** Terrain footprint sampling, cardinal orientation and cottage/windmill entrance access. */
import { sampleWindmillEntranceTerrain } from "./sample-windmill-entrance-terrain.js";
import { getStairLayout } from "../cottages/get-stair-layout.js";
import { transformPropGroundPoint } from "./transform-prop-ground-point.js";
export function getWindmillPlacementAccess(value, value2) {
  let windmillEntranceTerrainResult = sampleWindmillEntranceTerrain(value, value2);
  let result =
    windmillEntranceTerrainResult.near > 0.3
      ? windmillEntranceTerrainResult.hi
      : windmillEntranceTerrainResult.near;
  let result2 = result > 0.3;
  let stairLayoutResult = getStairLayout(0.66, Math.min(0.2, result));
  let result3 = !result2 && 0.66 - Math.min(0.2, result) > 0.3;
  let result4 = result2 ? Math.max(1, Math.round((result - 0.66) / 0.27)) : 0;
  return {
    frontGround: result,
    front: transformPropGroundPoint(
      value2,
      0,
      2.7 + (result3 ? stairLayoutResult.n * stairLayoutResult.depth : result4 * 0.4) + 0.5,
    ),
  };
}
