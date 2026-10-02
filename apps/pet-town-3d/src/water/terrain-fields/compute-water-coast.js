import { createCoastDistanceTransform } from "./create-coast-distance-transform.js";

/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */
/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */

export function computeWaterCoast(region, state) {
  region.diagonalDistance = Math.SQRT2;
  region.distanceTransform = createCoastDistanceTransform(region, state);
  region.distanceToLand = new Float32Array(region.cellCount);
  region.distanceToWater = new Float32Array(region.cellCount);
  region.distanceTransform(
    region.distanceToLand,
    (value34) => region.landMask[value34],
    state.distanceToLand,
  );
  region.distanceTransform(
    region.distanceToWater,
    (value35) => !region.landMask[value35],
    state.distanceToWater,
  );
  region.blurredLandDistance = new Float32Array(region.cellCount);
  region.blurredWaterDistance = new Float32Array(region.cellCount);
  region.signedCoastDistance = new Float32Array(region.cellCount);
  state.blurField(
    region.distanceToLand,
    region.blurredLandDistance,
    region.width,
    region.height,
    1,
  );
  state.blurField(
    region.distanceToWater,
    region.blurredWaterDistance,
    region.width,
    region.height,
    1,
  );
  for (let index17 = 0; index17 < region.cellCount; index17++) {
    region.signedCoastDistance[index17] = region.landMask[index17]
      ? -region.blurredWaterDistance[index17]
      : region.blurredLandDistance[index17];
  }
}
