/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */
/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */

import { waterState } from "../state.js";
export function shapeWaterBed(region, state) {
  region.shapedBed = new Float32Array(region.cellCount);
  region.landCoverage = new Float32Array(region.cellCount);
  region.smoothedBed = new Float32Array(region.cellCount);
  region.smoothedCoverage = new Float32Array(region.cellCount);
  for (let index23 = 0; index23 < region.height; index23++) {
    for (let index24 = 0; index24 < region.width; index24++) {
      let result75 = index23 * region.width + index24;
      region.originX + region.startX + index24;
      region.originZ + region.startZ + index23;
      let result76 =
        state.bedNoise[(region.startZ + index23) * region.textureWidth + (region.startX + index24)];
      let result77 =
        region.surfaceY -
        0.55 -
        0.18 * region.distanceToLand[result75] -
        0.012 * region.distanceToLand[result75] * region.distanceToLand[result75] +
        result76 * Math.min(1, region.distanceToLand[result75] / 3);
      let result78 = region.bedHeights[result75];
      if (!Number.isFinite(result78)) {
        result78 = Math.min(result77, region.surfaceY - 1.2);
        region.bedHeights[result75] = Math.max(
          result78,
          region.surfaceY - waterState.waterFieldDeepDepth,
        );
      } else if (!region.landMask[result75]) {
        let result79 = 1 - Math.min(1, Math.max(0, (region.distanceToLand[result75] - 8) / 10));
        let result80 = result77 * result79 + Math.min(result78, result77) * (1 - result79);
        result78 += (result80 - result78) * region.smoothedOpenness[result75];
      }
      result78 = Math.max(result78, region.surfaceY - waterState.waterFieldDeepDepth);
      region.shapedBed[result75] = Math.min(result78, region.surfaceY + 0.6);
      region.landCoverage[result75] = region.landMask[result75];
    }
  }
  state.blurField(region.shapedBed, region.smoothedBed, region.width, region.height, 1);
  state.blurField(region.landCoverage, region.smoothedCoverage, region.width, region.height, 1);
}
