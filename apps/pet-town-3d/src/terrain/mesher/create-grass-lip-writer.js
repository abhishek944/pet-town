/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
import { terrainState } from "../state.js";
export function createGrassLipWriter(chunk, state) {
  return function (value89, value90, value91, value92, value93) {
    let result153 = terrainState.voxelFaceFrames[value92];
    let n3 = result153.n;
    let result154 = result153.ua === 1 ? result153.va : result153.ua;
    let values18 = [0, 0, 0];
    values18[result154] = 1;
    let result155 = (result154 === 0 ? value89 : value91) & 1;
    let result156 = value90 & 1;
    let result157 = !state.isSolid(value89 - values18[0], value90, value91 - values18[2]);
    let result158 = !state.isSolid(value89 + values18[0], value90, value91 + values18[2]);
    let result159 = result157 ? state.bevel : 0;
    let result160 = result158 ? 1 - state.bevel : 1;
    let result161 = value90 + 1;
    let result162 = value89 - state.halfSize;
    let result163 = value91 - state.halfSize;
    let values19 = [result162 + +(n3[0] > 0), 0, result163 + +(n3[2] > 0)];
    if (values18[0]) {
      values19[0] = result162;
    }
    if (values18[2]) {
      values19[2] = result163;
    }
    let values20 = [1, 1, 1];
    state.tint(`grass`, result162 + 0.5, result161, result163 + 0.5, 2, value93, values20, 1, 0);
    let values21 = [
      [0.55, 0.83],
      [0.8, 0.6],
      [0.93, 0.36],
    ];
    let callback17 = (value94, value95, value96, value97, value98, value99) => {
      let values22 = [];
      for (let index41 = 0; index41 < 3; index41++) {
        let [result165, result166, result167] = chunk.lipProfile[index41];
        values22.push(
          chunk.emitLipVertex(
            value95 + value97 * result165,
            result161 + result166 - 0.004,
            value96 + value98 * result165,
            value97 * values21[index41][0],
            values21[index41][1],
            value98 * values21[index41][0],
            value99,
            result167,
            value92,
            result155,
            result156,
            values20[0],
            values20[1],
            values20[2],
            index41 === 0 ? 1 : 0.93,
          ),
        );
      }
      return values22;
    };
    let callback18 = (value100, value101) => {
      for (let index42 = 0; index42 < 2; index42++) {
        chunk.lipIndices.push(
          value100[index42],
          value101[index42],
          value101[index42 + 1],
          value100[index42],
          value101[index42 + 1],
          value100[index42 + 1],
        );
      }
    };
    let callback19 = (value102) => [
      values19[0] + values18[0] * value102,
      values19[2] + values18[2] * value102,
    ];
    let [callback19Result, callback19Result2] = callback19(result159);
    let [callback19Result3, callback19Result4] = callback19(result160);
    let callback17Result = callback17(
      result159,
      callback19Result,
      callback19Result2,
      n3[0],
      n3[2],
      result159,
    );
    let callback17Result2 = callback17(
      result160,
      callback19Result3,
      callback19Result4,
      n3[0],
      n3[2],
      result160,
    );
    let result164 = n3[0] * values18[2] - n3[2] * values18[0] > 0;
    if (result164) {
      callback18(callback17Result, callback17Result2);
    } else {
      callback18(callback17Result2, callback17Result);
    }
    for (let [result168, result169, result170] of [
      [result157, result159, -1],
      [result158, result160, 1],
    ]) {
      if (!result168) {
        continue;
      }
      let [callback19Result5, callback19Result6] = callback19(result169);
      let result171 = callback19Result5 - n3[0] * state.bevel;
      let result172 = callback19Result6 - n3[2] * state.bevel;
      let result173 = result170 > 0 ? callback17Result2 : callback17Result;
      for (let result174 = 1; result174 <= 2; result174++) {
        let result175 = (result174 / 2) * (Math.PI / 4);
        let result176 = n3[0] * Math.cos(result175) + values18[0] * result170 * Math.sin(result175);
        let result177 = n3[2] * Math.cos(result175) + values18[2] * result170 * Math.sin(result175);
        let callback17Result3 = callback17(
          0,
          result171 + result176 * state.bevel,
          result172 + result177 * state.bevel,
          result176,
          result177,
          result169 + result170 * state.bevel * result175,
        );
        if (result164 === result170 > 0) {
          callback18(result173, callback17Result3);
        } else {
          callback18(callback17Result3, result173);
        }
        result173 = callback17Result3;
      }
    }
  };
}
