/** Distance-along-polyline sampling and deterministic voxel island generation. */
import { clampTerrainScalar } from "../interpolation/clamp-terrain-scalar.js";
export function measurePolylineDistance(value, value2, values) {
  let result = 1e9;
  let index = 0;
  let index2 = 0;
  for (let index3 = 0; index3 < values.length - 1; index3++) {
    let [result2, result3] = values[index3];
    let [result4, result5] = values[index3 + 1];
    let result6 = result4 - result2;
    let result7 = result5 - result3;
    let result8 = result6 * result6 + result7 * result7;
    let result9 = ((value - result2) * result6 + (value2 - result3) * result7) / result8;
    result9 = clampTerrainScalar(result9, 0, 1);
    let result10 = result2 + result6 * result9 - value;
    let result11 = result3 + result7 * result9 - value2;
    let hypotResult = Math.hypot(result10, result11);
    let result12 = Math.sqrt(result8);
    if (hypotResult < result) {
      result = hypotResult;
      index = index2 + result9 * result12;
    }
    index2 += result12;
  }
  return {
    d: result,
    t: index,
    len: index2,
  };
}
