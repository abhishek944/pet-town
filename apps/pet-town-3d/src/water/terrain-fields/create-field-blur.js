/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */

export function createFieldBlur(state) {
  return function (value13, value14, value15, value16, value17 = 1) {
    if (!state.blurScratch || state.blurScratch.length < value15 * value16) {
      state.blurScratch = new Float32Array(value15 * value16);
    }
    let valuesValue = state.blurScratch;
    let value13Value = value13;
    for (let index6 = 0; index6 < value17; index6++) {
      for (let index7 = 0; index7 < value16; index7++) {
        let result43 = index7 * value15;
        for (let index8 = 0; index8 < value15; index8++) {
          let result44 = result43 + index8;
          if (index8 >= 2 && index8 < value15 - 2) {
            valuesValue[result44] =
              (value13Value[result44 - 2] +
                4 * value13Value[result44 - 1] +
                6 * value13Value[result44] +
                4 * value13Value[result44 + 1] +
                value13Value[result44 + 2]) *
              0.0625;
          } else {
            let callback8 = (value18) =>
              value13Value[result43 + Math.min(value15 - 1, Math.max(0, index8 + value18))];
            valuesValue[result44] =
              (callback8(-2) +
                4 * callback8(-1) +
                6 * callback8(0) +
                4 * callback8(1) +
                callback8(2)) *
              0.0625;
          }
        }
      }
      for (let index9 = 0; index9 < value16; index9++) {
        let result45 = index9 * value15;
        let result46 = index9 >= 2 && index9 < value16 - 2;
        for (let index10 = 0; index10 < value15; index10++) {
          let result47 = result45 + index10;
          if (result46) {
            value14[result47] =
              (valuesValue[result47 - 2 * value15] +
                4 * valuesValue[result47 - value15] +
                6 * valuesValue[result47] +
                4 * valuesValue[result47 + value15] +
                valuesValue[result47 + 2 * value15]) *
              0.0625;
          } else {
            let callback9 = (value19) =>
              valuesValue[Math.min(value16 - 1, Math.max(0, index9 + value19)) * value15 + index10];
            value14[result47] =
              (callback9(-2) +
                4 * callback9(-1) +
                6 * callback9(0) +
                4 * callback9(1) +
                callback9(2)) *
              0.0625;
          }
        }
      }
      value13Value = value14;
    }
  };
}
