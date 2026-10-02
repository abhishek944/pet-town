/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */

export function createTerrainBoundsQuery(state) {
  return function () {
    let callbackResult4 = state.getTerrain();
    if (callbackResult4?.bounds && Number.isFinite(callbackResult4.bounds.minX)) {
      let bounds2 = callbackResult4.bounds;
      return {
        x0: Math.floor(bounds2.minX),
        z0: Math.floor(bounds2.minZ),
        x1: Math.ceil(bounds2.maxX),
        z1: Math.ceil(bounds2.maxZ),
      };
    }
    if (Number.isFinite(callbackResult4?.size) && callbackResult4.size > 0) {
      let result35 = Math.round(callbackResult4.size / 2);
      return {
        x0: -result35,
        z0: -result35,
        x1: result35,
        z1: result35,
      };
    }
    let result31 = 1 / 0;
    let result32 = 1 / 0;
    let result33 = -1 / 0;
    let result34 = -1 / 0;
    for (let result36 = -96; result36 < 96; result36++) {
      for (let result37 = -96; result37 < 96; result37++) {
        let callback2Result2 = state.sampleTerrainTop(result37, result36);
        if (Number.isFinite(callback2Result2) && callback2Result2 > 0) {
          if (result37 < result31) {
            result31 = result37;
          }
          if (result37 > result33) {
            result33 = result37;
          }
          if (result36 < result32) {
            result32 = result36;
          }
          if (result36 > result34) {
            result34 = result36;
          }
        }
      }
    }
    return Number.isFinite(result31)
      ? {
          x0: result31,
          z0: result32,
          x1: result33 + 1,
          z1: result34 + 1,
        }
      : {
          x0: -48,
          z0: -48,
          x1: 48,
          z1: 48,
        };
  };
}
