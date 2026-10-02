/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */
/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */
import * as THREE from "three";
export function uploadWaterFieldWindow(region, state) {
  region.encodePixel = state.floatLinearSupported
    ? (value38) => value38
    : THREE.DataUtils.toHalfFloat;
  for (let value25Value = region.writeStartZ; value25Value < region.writeEndZ; value25Value++) {
    for (let value24Value = region.writeStartX; value24Value < region.writeEndX; value24Value++) {
      let result91 = (value25Value - region.startZ) * region.width + (value24Value - region.startX);
      let result92 = value25Value * region.textureWidth + value24Value;
      state.exactBed[result92] = region.bedHeights[result91];
      state.smoothBed[result92] = region.smoothedBed[result91];
      state.voidWeight[result92] = region.voidWeights[result91];
      state.landNear[result92] = Math.min(1, region.smoothedCoverage[result91] * 2.5);
      state.coastDistance[result92] = region.signedCoastDistance[result91];
      state.openWater[result92] = region.smoothedOpenness[result91];
      state.distanceToLand[result92] = region.distanceToLand[result91];
      state.distanceToWater[result92] = region.distanceToWater[result91];
      if (region.flowX) {
        state.flowX[result92] = region.flowX[result91];
        state.flowZ[result92] = region.flowZ[result91];
      } else {
        if (region.landMask[result91]) {
          state.flowX[result92] = 0;
          state.flowZ[result92] = 0;
        }
      }
      state.heightPixels[result92 * 4] = region.encodePixel(state.exactBed[result92]);
      state.heightPixels[result92 * 4 + 1] = region.encodePixel(state.smoothBed[result92]);
      state.heightPixels[result92 * 4 + 2] = region.encodePixel(state.voidWeight[result92]);
      state.heightPixels[result92 * 4 + 3] = region.encodePixel(state.landNear[result92]);
      state.waterPixels[result92 * 4] = region.encodePixel(
        Math.max(-2, Math.min(2, state.coastDistance[result92] / 16)),
      );
      state.waterPixels[result92 * 4 + 1] = region.encodePixel(state.flowX[result92]);
      state.waterPixels[result92 * 4 + 2] = region.encodePixel(state.flowZ[result92]);
      state.waterPixels[result92 * 4 + 3] = region.encodePixel(state.openWater[result92]);
    }
    if (region.incremental) {
      state.heightTexture.addUpdateRange(
        (value25Value * region.textureWidth + region.writeStartX) * 4,
        (region.writeEndX - region.writeStartX) * 4,
      );
      state.waterTexture.addUpdateRange(
        (value25Value * region.textureWidth + region.writeStartX) * 4,
        (region.writeEndX - region.writeStartX) * 4,
      );
    }
  }
  state.heightTexture.needsUpdate = true;
  state.waterTexture.needsUpdate = true;
}
