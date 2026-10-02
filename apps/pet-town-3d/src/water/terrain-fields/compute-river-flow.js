/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */
/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */

export function computeRiverFlow(region, state) {
  region.flowX = null;
  region.flowZ = null;
  if (!region.incremental) {
    let fillResult = new Float32Array(region.cellCount).fill(-1);
    let int32Array = new Int32Array(region.cellCount);
    let index25 = 0;
    let index26 = 0;
    for (let index27 = 0; index27 < region.cellCount; index27++) {
      if (
        !region.landMask[index27] &&
        (region.smoothedOpenness[index27] > 0.6 || region.voidWeights[index27] > 0)
      ) {
        fillResult[index27] = 0;
        int32Array[index26++] = index27;
      }
    }
    for (; index25 < index26;) {
      let result81 = int32Array[index25++];
      let result82 = result81 % region.width;
      let result83 = (result81 / region.width) | 0;
      let result84 = fillResult[result81] + 1;
      if (result82 > 0 && fillResult[result81 - 1] < 0 && !region.landMask[result81 - 1]) {
        fillResult[result81 - 1] = result84;
        int32Array[index26++] = result81 - 1;
      }
      if (
        result82 < region.width - 1 &&
        fillResult[result81 + 1] < 0 &&
        !region.landMask[result81 + 1]
      ) {
        fillResult[result81 + 1] = result84;
        int32Array[index26++] = result81 + 1;
      }
      if (
        result83 > 0 &&
        fillResult[result81 - region.width] < 0 &&
        !region.landMask[result81 - region.width]
      ) {
        fillResult[result81 - region.width] = result84;
        int32Array[index26++] = result81 - region.width;
      }
      if (
        result83 < region.height - 1 &&
        fillResult[result81 + region.width] < 0 &&
        !region.landMask[result81 + region.width]
      ) {
        fillResult[result81 + region.width] = result84;
        int32Array[index26++] = result81 + region.width;
      }
    }
    let floatBuffer14 = new Float32Array(region.cellCount);
    let floatBuffer15 = new Float32Array(region.cellCount);
    let callback12 = (value36, value37) =>
      fillResult[value36] >= 0 ? fillResult[value36] : value37;
    for (let result85 = 1; result85 < region.height - 1; result85++) {
      for (let result86 = 1; result86 < region.width - 1; result86++) {
        let result87 = result85 * region.width + result86;
        if (fillResult[result87] < 0 || region.riverWeights[result87] <= 0) {
          continue;
        }
        let result88 = fillResult[result87];
        let result89 = callback12(result87 + 1, result88) - callback12(result87 - 1, result88);
        let result90 =
          callback12(result87 + region.width, result88) -
          callback12(result87 - region.width, result88);
        let hypotResult = Math.hypot(result89, result90);
        if (!(hypotResult < 1e-4)) {
          floatBuffer14[result87] = (-result89 / hypotResult) * region.riverWeights[result87];
          floatBuffer15[result87] = (-result90 / hypotResult) * region.riverWeights[result87];
        }
      }
    }
    region.flowX = new Float32Array(region.cellCount);
    region.flowZ = new Float32Array(region.cellCount);
    state.blurField(floatBuffer14, region.flowX, region.width, region.height, 2);
    state.blurField(floatBuffer15, region.flowZ, region.width, region.height, 2);
  }
}
