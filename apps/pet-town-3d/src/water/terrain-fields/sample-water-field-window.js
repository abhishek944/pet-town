/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */
/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */

export function sampleWaterFieldWindow(region, state) {
  region.surfaceY = state.getSurfaceY();
  ({ x: region.originX, z: region.originZ, w: region.textureWidth } = state.rect);
  region.bounds = state.bounds;
  region.cellCount = region.width * region.height;
  region.landMask = new Uint8Array(region.cellCount);
  region.bedHeights = new Float32Array(region.cellCount);
  region.voidWeights = new Float32Array(region.cellCount);
  region.terrain = state.getTerrain();
  region.biomeAt =
    !region.incremental && typeof region.terrain?.biomeAt == `function`
      ? region.terrain.biomeAt
      : null;
  region.riverWeights = region.incremental ? null : new Float32Array(region.cellCount);
  region.textureIndexAt = (value29, value30) =>
    (region.startZ + value30) * region.textureWidth + (region.startX + value29);
  for (let index11 = 0; index11 < region.height; index11++) {
    for (let index12 = 0; index12 < region.width; index12++) {
      let result54 = region.originX + region.startX + index12;
      let result55 = region.originZ + region.startZ + index11;
      let result56 = index11 * region.width + index12;
      let result57 =
        result54 >= region.bounds.x0 &&
        result54 < region.bounds.x1 &&
        result55 >= region.bounds.z0 &&
        result55 < region.bounds.z1;
      let result58 = Math.max(region.bounds.x0 - result54, 0, result54 - (region.bounds.x1 - 1));
      let result59 = Math.max(region.bounds.z0 - result55, 0, result55 - (region.bounds.z1 - 1));
      let result60 = result57 ? state.sampleTerrainTop(result54, result55) : NaN;
      if (
        ((result60 = Number.isFinite(result60)
          ? state.sampleSolidBed(result54, result55, result60, region.surfaceY)
          : NaN),
        (region.bedHeights[result56] = result60),
        (region.voidWeights[result56] = result57
          ? 0
          : Math.min(1, Math.hypot(result58, result59) / 3)),
        (region.landMask[result56] =
          Number.isFinite(result60) && result60 > region.surfaceY ? 1 : 0),
        region.biomeAt && result57 && !region.landMask[result56])
      ) {
        let result49Result = region.biomeAt(result54 + 0.5, result55 + 0.5);
        region.riverWeights[result56] =
          result49Result === `river` ? 1 : result49Result === `pond` ? 0.12 : 0;
      }
    }
  }
}
