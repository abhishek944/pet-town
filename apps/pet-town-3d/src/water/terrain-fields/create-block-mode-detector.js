/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */

export function createBlockModeDetector(state) {
  return function () {
    let callbackResult2 = state.getTerrain();
    if (
      ((state.blockMode = false),
      state.emptyBlockIds.clear(),
      state.emptyBlockIds.add(0),
      state.emptyBlockIds.add(null),
      state.emptyBlockIds.add(undefined),
      typeof callbackResult2?.blockAt != `function` || !state.bounds)
    ) {
      return;
    }
    let blocks2 = callbackResult2.blocks;
    if (Array.isArray(blocks2)) {
      blocks2.forEach((solidValue, value4) => {
        if (
          solidValue &&
          (solidValue.solid === false || /water|air/i.test(String(solidValue.name ?? ``)))
        ) {
          state.emptyBlockIds.add(solidValue.id ?? value4);
        }
      });
    }
    let index = 0;
    let index2 = 0;
    let resultValue = state.bounds;
    for (let index3 = 0; index3 < 64; index3++) {
      let result27 =
        resultValue.x0 +
        Math.floor((((index3 * 37) % 64) / 64) * (resultValue.x1 - resultValue.x0));
      let result28 =
        resultValue.z0 +
        Math.floor((((index3 * 23) % 64) / 64) * (resultValue.z1 - resultValue.z0));
      let callback2Result = state.sampleTerrainTop(result27, result28);
      if (callback2Result >= 1) {
        index2++;
        if (
          !state.emptyBlockIds.has(
            callbackResult2.blockAt(result27 + 0.5, callback2Result - 0.5, result28 + 0.5),
          )
        ) {
          index++;
        }
      }
    }
    state.blockMode = index2 > 4 && index / index2 > 0.8;
  };
}
