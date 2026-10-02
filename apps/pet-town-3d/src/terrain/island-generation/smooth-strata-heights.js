/** Distance-along-polyline sampling and deterministic voxel island generation. */

import { clampTerrainScalar } from "../interpolation/clamp-terrain-scalar.js";
export function smoothStrataHeights(island) {
  island.strataHeights = new Float32Array(16384);
  {
    let callback6 = (value7, value8, value9, value10, value11) => {
      for (let index20 = 0; index20 < 128; index20++) {
        for (let index21 = 0; index21 < 128; index21++) {
          let index22 = 0;
          let index23 = 0;
          for (let result79 = -value11; result79 <= value11; result79++) {
            let clampTerrainScalarResult2 = clampTerrainScalar(index21 + value9 * result79, 0, 127);
            let clampTerrainScalarResult3 = clampTerrainScalar(
              index20 + value10 * result79,
              0,
              127,
            );
            index22 += value7[clampTerrainScalarResult3 * 128 + clampTerrainScalarResult2];
            index23++;
          }
          value8[index20 * 128 + index21] = index22 / index23;
        }
      }
    };
    let floatBuffer5 = new Float32Array(16384);
    callback6(Float32Array.from(island.heights), floatBuffer5, 1, 0, 8);
    callback6(floatBuffer5, island.strataHeights, 0, 1, 8);
    callback6(island.strataHeights, floatBuffer5, 1, 0, 6);
    callback6(floatBuffer5, island.strataHeights, 0, 1, 6);
    for (let index24 = 0; index24 < 16384; index24++) {
      island.strataHeights[index24] = Math.max(
        island.strataHeights[index24],
        island.heights[index24] - 5,
      );
    }
  }
}
