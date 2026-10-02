/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
import { createSeededRandom } from "../../../math/random/create-seeded-random.js";
import { terrainState } from "../../state.js";
export function createTileableVoronoiSampler(value, value2, value3 = 0.8, value4 = value2) {
  let seededRandomResult = createSeededRandom(value);
  let floatBuffer = new Float32Array(value2 * value4 * 3);
  let result = terrainState.terrainTextureLogicalSize / value2;
  let result2 = terrainState.terrainTextureLogicalSize / value4;
  for (let index = 0; index < value4; index++) {
    for (let index2 = 0; index2 < value2; index2++) {
      let result4 = (index * value2 + index2) * 3;
      floatBuffer[result4] = (index2 + 0.5 + (seededRandomResult() - 0.5) * value3) * result;
      floatBuffer[result4 + 1] = (index + 0.5 + (seededRandomResult() - 0.5) * value3) * result2;
      floatBuffer[result4 + 2] = seededRandomResult();
    }
  }
  let result3 = result / result2;
  return (value5, value6) => {
    let result5 = Math.floor(value5 / result);
    let result6 = Math.floor(value6 / result2);
    let result7 = 1e9;
    let result8 = 1e9;
    let index3 = 0;
    let index4 = 0;
    let index5 = 0;
    for (let result9 = -1; result9 <= 1; result9++) {
      for (let result10 = -1; result10 <= 1; result10++) {
        let result11 = result5 + result10;
        let result12 = result6 + result9;
        let index6 = 0;
        let index7 = 0;
        if (result11 < 0) {
          result11 += value2;
          index6 = -256;
        } else {
          if (result11 >= value2) {
            result11 -= value2;
            index6 = terrainState.terrainTextureLogicalSize;
          }
        }
        if (result12 < 0) {
          result12 += value4;
          index7 = -256;
        } else {
          if (result12 >= value4) {
            result12 -= value4;
            index7 = terrainState.terrainTextureLogicalSize;
          }
        }
        let result13 = (result12 * value2 + result11) * 3;
        let result14 = floatBuffer[result13] + index6;
        let result15 = floatBuffer[result13 + 1] + index7;
        let hypotResult = Math.hypot(result14 - value5, (result15 - value6) * result3);
        if (hypotResult < result7) {
          result8 = result7;
          result7 = hypotResult;
          index3 = floatBuffer[result13 + 2];
          index4 = result14;
          index5 = result15;
        } else {
          if (hypotResult < result8) {
            result8 = hypotResult;
          }
        }
      }
    }
    return [result7, result8, index3, value5 - index4, value6 - index5];
  };
}
