/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */
/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */

export function computeWaterOpenness(region, state) {
  region.distanceIntegral = new Float64Array((region.width + 1) * (region.height + 1));
  region.openness = new Float32Array(region.cellCount);
  region.smoothedOpenness = new Float32Array(region.cellCount);
  for (let index18 = 0; index18 < region.height; index18++) {
    let index19 = 0;
    for (let index20 = 0; index20 < region.width; index20++) {
      index19 += region.distanceToLand[index18 * region.width + index20];
      region.distanceIntegral[(index18 + 1) * (region.width + 1) + index20 + 1] =
        region.distanceIntegral[index18 * (region.width + 1) + index20 + 1] + index19;
    }
  }
  for (let index21 = 0; index21 < region.height; index21++) {
    for (let index22 = 0; index22 < region.width; index22++) {
      let result69 = Math.max(0, index22 - 10);
      let result70 = Math.min(region.width, index22 + 10 + 1);
      let result71 = Math.max(0, index21 - 10);
      let result72 = Math.min(region.height, index21 + 10 + 1);
      let result73 =
        (region.distanceIntegral[result72 * (region.width + 1) + result70] -
          region.distanceIntegral[result71 * (region.width + 1) + result70] -
          region.distanceIntegral[result72 * (region.width + 1) + result69] +
          region.distanceIntegral[result71 * (region.width + 1) + result69]) /
        ((result70 - result69) * (result72 - result71));
      let result74 = Math.min(1, Math.max(0, (result73 - 1) / 1.4));
      region.openness[index21 * region.width + index22] = result74 * result74 * (3 - 2 * result74);
    }
  }
  state.blurField(region.openness, region.smoothedOpenness, region.width, region.height, 1);
}
