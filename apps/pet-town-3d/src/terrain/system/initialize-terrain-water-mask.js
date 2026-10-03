/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */
/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */
import * as THREE from "three";
export function initializeTerrainWaterMask(state) {
  state.heightPixels = new Float32Array(state.size * state.size);
  state.heightTexture = new THREE.DataTexture(
    state.heightPixels,
    state.size,
    state.size,
    THREE.RedFormat,
    THREE.FloatType,
  );
  state.heightTexture.magFilter = THREE.NearestFilter;
  state.heightTexture.minFilter = THREE.NearestFilter;
  (() => {
    for (let index12 = 0; index12 < state.size * state.size; index12++) {
      state.heightPixels[index12] = state.columnTops[index12];
    }
    state.heightTexture.needsUpdate = true;
  })();
  state.waterMaskPixels = new Uint8Array(state.size * state.size);
  for (let index13 = 0; index13 < state.size * state.size; index13++) {
    state.waterMaskPixels[index13] =
      state.columnTops[index13] < 7.62 &&
      (state.island.flags[index13] & 3 || state.island.landMask[index13] < 0.55)
        ? 255
        : 0;
  }
  state.waterMaskTexture = new THREE.DataTexture(
    state.waterMaskPixels,
    state.size,
    state.size,
    THREE.RedFormat,
    THREE.UnsignedByteType,
  );
  state.waterMaskTexture.magFilter = THREE.LinearFilter;
  state.waterMaskTexture.minFilter = THREE.LinearFilter;
  state.waterMaskTexture.needsUpdate = true;
  state.floodWaterMask = (value27, value28) => {
    let values2 = [[value27, value28]];
    for (; values2.length;) {
      let [result47, result48] = values2.pop();
      let result49 = result48 * state.size + result47;
      if (!(state.waterMaskPixels[result49] || state.columnTops[result49] >= 7.62)) {
        state.waterMaskPixels[result49] = 255;
        for (let [result50, result51] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          let result52 = result47 + result50;
          let result53 = result48 + result51;
          if (result52 >= 0 && result53 >= 0 && result52 < state.size && result53 < state.size) {
            values2.push([result52, result53]);
          }
        }
      }
    }
  };
  state.updateWaterMask = (value29, value30) => {
    let result54 = value30 * state.size + value29;
    if (state.columnTops[result54] >= 7.62) {
      if (state.waterMaskPixels[result54]) {
        state.waterMaskPixels[result54] = 0;
        state.waterMaskTexture.needsUpdate = true;
      }
      return;
    }
    let enabled3 = false;
    for (let [result55, result56] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      let result57 = value29 + result55;
      let result58 = value30 + result56;
      if (
        result57 >= 0 &&
        result58 >= 0 &&
        result57 < state.size &&
        result58 < state.size &&
        state.waterMaskPixels[result58 * state.size + result57]
      ) {
        enabled3 = true;
      }
    }
    if (enabled3 && !state.waterMaskPixels[result54]) {
      state.floodWaterMask(value29, value30);
      state.waterMaskTexture.needsUpdate = true;
    }
  };
}
