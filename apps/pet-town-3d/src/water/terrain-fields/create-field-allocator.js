/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */

import { waterState } from "../state.js";
import { sampleWaterBedNoise } from "./sample-water-bed-noise.js";
export function createFieldAllocator(state) {
  return function () {
    state.bounds = state.findTerrainBounds();
    state.detectBlockMode();
    let result38 = state.bounds.x1 - state.bounds.x0 + 96;
    let result39 = state.bounds.z1 - state.bounds.z0 + 96;
    state.rect = {
      x: state.bounds.x0 - waterState.waterFieldBorderPadding,
      z: state.bounds.z0 - waterState.waterFieldBorderPadding,
      w: result38,
      h: result39,
    };
    let result40 = result38 * result39;
    state.heightPixels = state.floatLinearSupported
      ? new Float32Array(result40 * 4)
      : new Uint16Array(result40 * 4);
    state.waterPixels = state.floatLinearSupported
      ? new Float32Array(result40 * 4)
      : new Uint16Array(result40 * 4);
    state.bedNoise = new Float32Array(result40);
    for (let index4 = 0; index4 < result39; index4++) {
      for (let index5 = 0; index5 < result38; index5++) {
        let result41 = state.rect.x + index5;
        let result42 = state.rect.z + index4;
        state.bedNoise[index4 * result38 + index5] =
          (sampleWaterBedNoise(result41 * 0.06, result42 * 0.06) - 0.5) * 2.2 +
          (sampleWaterBedNoise(result41 * 0.19 + 7, result42 * 0.19 - 3) - 0.5) * 0.8;
      }
    }
    state.exactBed = new Float32Array(result40);
    state.smoothBed = new Float32Array(result40);
    state.voidWeight = new Float32Array(result40);
    state.landNear = new Float32Array(result40);
    state.coastDistance = new Float32Array(result40);
    state.openWater = new Float32Array(result40);
    state.flowX = new Float32Array(result40);
    state.flowZ = new Float32Array(result40);
    state.distanceToLand = new Float32Array(result40).fill(waterState.waterCoastDistanceLimit);
    state.distanceToWater = new Float32Array(result40).fill(waterState.waterCoastDistanceLimit);
    state.heightTexture?.dispose();
    state.waterTexture?.dispose();
    state.heightTexture = state.createFieldTexture(state.heightPixels, result38, result39);
    state.waterTexture = state.createFieldTexture(state.waterPixels, result38, result39);
  };
}
