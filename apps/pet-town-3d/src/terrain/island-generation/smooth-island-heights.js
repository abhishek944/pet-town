/** Distance-along-polyline sampling and deterministic voxel island generation. */

import { clampTerrainScalar } from "../interpolation/clamp-terrain-scalar.js";
export function smoothIslandHeights(island) {
  island.heights = new Int16Array(16384);
  for (let index3 = 0; index3 < 16384; index3++) {
    island.heights[index3] = clampTerrainScalar(Math.round(island.smoothHeights[index3]), 1, 34);
  }
  for (let index4 = 0; index4 < 128; index4++) {
    for (let index5 = 0; index5 < 128; index5++) {
      let result29 = index4 * 128 + index5;
      if (
        island.landMask[result29] > 0.85 &&
        !(island.flags[result29] & 3) &&
        island.heights[result29] < 8
      ) {
        island.heights[result29] = 8;
      }
    }
  }
  for (let index6 = 0; index6 < 2; index6++) {
    for (let result30 = 1; result30 < 127; result30++) {
      for (let result31 = 1; result31 < 127; result31++) {
        let result32 = result30 * 128 + result31;
        let result33 = island.heights[result32];
        let result34 = island.heights[result32 - 1];
        let result35 = island.heights[result32 + 1];
        let result36 = island.heights[result32 - 128];
        let result37 = island.heights[result32 + 128];
        let result38 = Math.min(result34, result35, result36, result37);
        let result39 = Math.max(result34, result35, result36, result37);
        if (result33 > result39) {
          island.heights[result32] = result39;
        } else {
          if (result33 < result38) {
            island.heights[result32] = result38;
          }
        }
      }
    }
  }
  island.morphHeights = (value5, value6) => {
    let indexBuffer2 = new Int16Array(16384);
    for (let index7 = 0; index7 < 128; index7++) {
      for (let index8 = 0; index8 < 128; index8++) {
        let result40 = value6 ? -1e4 : 1e4;
        for (let result41 = -1; result41 <= 1; result41++) {
          for (let result42 = -1; result42 <= 1; result42++) {
            let clampTerrainScalarResult = clampTerrainScalar(index8 + result42, 0, 127);
            let result43 =
              value5[
                clampTerrainScalar(index7 + result41, 0, 127) * 128 + clampTerrainScalarResult
              ];
            result40 = value6 ? Math.max(result40, result43) : Math.min(result40, result43);
          }
        }
        indexBuffer2[index7 * 128 + index8] = result40;
      }
    }
    return indexBuffer2;
  };
  {
    let sliceResult = island.heights.slice();
    let callbackResult = island.morphHeights(island.morphHeights(island.heights, false), true);
    callbackResult = island.morphHeights(island.morphHeights(callbackResult, true), false);
    for (let index9 = 0; index9 < 16384; index9++) {
      if (island.flags[index9] & 7) {
        island.heights[index9] = sliceResult[index9];
        continue;
      }
      island.heights[index9] =
        island.landMask[index9] > 0.85
          ? Math.max(8, callbackResult[index9])
          : callbackResult[index9];
    }
    for (let index10 = 0; index10 < 16384; index10++) {
      if (island.flags[index10] & 3) {
        island.heights[index10] = Math.min(island.heights[index10], 7);
      }
    }
  }
}
