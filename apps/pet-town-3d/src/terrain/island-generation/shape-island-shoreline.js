/** Distance-along-polyline sampling and deterministic voxel island generation. */

export function shapeIslandShoreline(island) {
  {
    let fillResult = new Uint8Array(16384).fill(255);
    let values3 = [];
    for (let index11 = 0; index11 < 16384; index11++) {
      if (island.heights[index11] >= 8) {
        fillResult[index11] = 0;
        values3.push(index11);
      }
    }
    for (let index12 = 0; index12 < values3.length; index12++) {
      let result44 = values3[index12];
      let result45 = fillResult[result44];
      if (result45 >= 8) {
        continue;
      }
      let result46 = result44 % 128;
      let result47 = (result44 / 128) | 0;
      for (let result48 = -1; result48 <= 1; result48++) {
        for (let result49 = -1; result49 <= 1; result49++) {
          let result50 = result46 + result49;
          let result51 = result47 + result48;
          if (result50 < 0 || result51 < 0 || result50 >= 128 || result51 >= 128) {
            continue;
          }
          let result52 = result51 * 128 + result50;
          if (fillResult[result52] > result45 + 1) {
            fillResult[result52] = result45 + 1;
            values3.push(result52);
          }
        }
      }
    }
    for (let index13 = 0; index13 < 128; index13++) {
      for (let index14 = 0; index14 < 128; index14++) {
        let result53 = index13 * 128 + index14;
        if (
          island.flags[result53] & 3 ||
          island.heights[result53] >= 8 ||
          Math.min(index14, index13, 127 - index14, 127 - index13) < 4
        ) {
          continue;
        }
        let result54 = fillResult[result53];
        let result55 = +(island.fbm(index14 * 0.18 + 7, index13 * 0.18 - 3, 2) > 0.15);
        let result56 =
          result54 <= 2 + result55
            ? 7
            : result54 <= 3
              ? 6
              : result54 <= 4 + result55
                ? 5
                : result54 <= 5 + result55
                  ? 4
                  : result54 <= 7
                    ? 3
                    : 0;
        if (result56 > island.heights[result53]) {
          island.heights[result53] = result56;
          island.flags[result53] |= 32;
        }
      }
    }
    for (let index15 = 0; index15 < 2; index15++) {
      let sliceResult2 = island.heights.slice();
      let lookup = new Map();
      for (let result57 = 1; result57 < 127; result57++) {
        for (let result58 = 1; result58 < 127; result58++) {
          let result59 = result57 * 128 + result58;
          if (!(island.flags[result59] & 32)) {
            continue;
          }
          lookup.clear();
          for (let result62 = -1; result62 <= 1; result62++) {
            for (let result63 = -1; result63 <= 1; result63++) {
              let result64 = sliceResult2[result59 + result62 * 128 + result63];
              if (result64 < 8) {
                lookup.set(result64, (lookup.get(result64) || 0) + 1);
              }
            }
          }
          let result60 = sliceResult2[result59];
          let result61 = lookup.get(sliceResult2[result59]) || 0;
          for (let [result65, result66] of lookup) {
            if (result66 > result61) {
              result61 = result66;
              result60 = result65;
            }
          }
          island.heights[result59] = result60;
        }
      }
    }
  }
}
