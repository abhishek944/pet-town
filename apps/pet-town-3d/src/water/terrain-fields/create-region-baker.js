/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */
/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */

export function createRegionBaker(state) {
  return function (value39, value40, value41, value42) {
    if (!state.heightTexture) {
      state.allocateFields();
      return state.bakeAll();
    }
    let callback13 = (value43, value44) => Math.max(0, Math.min(value44, value43));
    let callback13Result = callback13(Math.floor(value39) - state.rect.x - 12, state.rect.w);
    let callback13Result2 = callback13(Math.ceil(value41) - state.rect.x + 12, state.rect.w);
    let callback13Result3 = callback13(Math.floor(value40) - state.rect.z - 12, state.rect.h);
    let callback13Result4 = callback13(Math.ceil(value42) - state.rect.z + 12, state.rect.h);
    if (callback13Result2 <= callback13Result || callback13Result4 <= callback13Result3) {
      return;
    }
    let callback13Result5 = callback13(callback13Result - 14, state.rect.w);
    let callback13Result6 = callback13(callback13Result2 + 14, state.rect.w);
    let callback13Result7 = callback13(callback13Result3 - 14, state.rect.h);
    let callback13Result8 = callback13(callback13Result4 + 14, state.rect.h);
    if (
      (callback13Result6 - callback13Result5) * (callback13Result8 - callback13Result7) >
      state.rect.w * state.rect.h * 0.5
    ) {
      return state.bakeAll();
    }
    state.bakeWindow(
      callback13Result5,
      callback13Result7,
      callback13Result6 - callback13Result5,
      callback13Result8 - callback13Result7,
      callback13Result,
      callback13Result3,
      callback13Result2,
      callback13Result4,
      true,
    );
  };
}
