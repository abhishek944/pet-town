/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
import { createSeededRandom } from "../../../math/random/create-seeded-random.js";
import { terrainState } from "../../state.js";
export function createTileableTextureNoise(value) {
  let seededRandomResult = createSeededRandom(value);
  let floatBuffer = new Float32Array(16384);
  for (let index = 0; index < floatBuffer.length; index++) {
    floatBuffer[index] = seededRandomResult() * 2 - 1;
  }
  let callback = (value2, value3, value4, value5 = value4) => {
    let result = (value2 / terrainState.terrainTextureLogicalSize) * value4;
    let result2 = (value3 / terrainState.terrainTextureLogicalSize) * value5;
    let result3 = Math.floor(result);
    let result4 = Math.floor(result2);
    let result5 = result - result3;
    let result6 = result2 - result4;
    result5 = result5 * result5 * result5 * (result5 * (result5 * 6 - 15) + 10);
    result6 = result6 * result6 * result6 * (result6 * (result6 * 6 - 15) + 10);
    let result7 = ((result3 % value4) + value4) % value4;
    let result8 = (result7 + 1) % value4;
    let result9 = ((result4 % value5) + value5) % value5;
    let result10 = (result9 + 1) % value5;
    let result11 = floatBuffer[result9 * 128 + result7];
    let result12 = floatBuffer[result9 * 128 + result8];
    let result13 = floatBuffer[result10 * 128 + result7];
    let result14 = floatBuffer[result10 * 128 + result8];
    return (
      result11 +
      (result12 - result11) * result5 +
      (result13 - result11) * result6 +
      (result11 - result12 - result13 + result14) * result5 * result6
    );
  };
  return {
    vn: callback,
    fbm: (value6, value7, value8, value9 = 3, value10 = value8) => {
      let index2 = 0;
      let result15 = 1;
      let index3 = 0;
      let value8Value = value8;
      let value10Value = value10;
      for (let index4 = 0; index4 < value9; index4++) {
        index2 +=
          result15 *
          callback(value6 + index4 * 37.1, value7 - index4 * 11.7, value8Value, value10Value);
        index3 += result15;
        result15 *= 0.5;
        value8Value = Math.min(value8Value * 2, 128);
        value10Value = Math.min(value10Value * 2, 128);
      }
      return index2 / index3;
    },
  };
}
