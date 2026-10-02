/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */

export function createWallHeightRebuilder(state) {
  return () => {
    let floatBuffer4 = new Float32Array(16384);
    let floatBuffer5 = new Float32Array(16384);
    let callback18 = (value3, value4) => (value3 < 0 ? 0 : value3 >= value4 ? value4 - 1 : value3);
    for (let index4 = 0; index4 < 128; index4++) {
      for (let index5 = 0; index5 < 128; index5++) {
        let result11 = -1e9;
        let result12 = 1e9;
        for (let result13 = -1; result13 <= 1; result13++) {
          for (let result14 = -1; result14 <= 1; result14++) {
            let result15 =
              state.columnTops[
                callback18(index4 + result13, 128) * 128 + callback18(index5 + result14, 128)
              ];
            if (result15 > result11) {
              result11 = result15;
            }
            if (result15 < result12) {
              result12 = result15;
            }
          }
        }
        floatBuffer4[index4 * 128 + index5] = result11;
        floatBuffer5[index4 * 128 + index5] = result12;
      }
    }
    for (let index6 = 0; index6 < 128; index6++) {
      for (let index7 = 0; index7 < 128; index7++) {
        let index8 = 0;
        let index9 = 0;
        for (let result16 = -1; result16 <= 1; result16++) {
          for (let result17 = -1; result17 <= 1; result17++) {
            let result18 =
              callback18(index6 + result16, 128) * 128 + callback18(index7 + result17, 128);
            index8 += floatBuffer4[result18];
            index9 += floatBuffer5[result18];
          }
        }
        state.wallMaximums[index6 * 128 + index7] = index8 / 9;
        state.wallMinimums[index6 * 128 + index7] = index9 / 9;
      }
    }
    state.wallHeightsDirty = false;
  };
}
