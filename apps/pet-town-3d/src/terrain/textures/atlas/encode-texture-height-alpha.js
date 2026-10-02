/** Bump encoding, texture array generation and incremental custom texture registration. */
import { terrainState } from "../../state.js";
import { clampTextureUnit } from "../canvas/clamp-texture-unit.js";
export function encodeTextureHeightAlpha(value, value2) {
  let terrainTexturePixelSizeValue = terrainState.terrainTexturePixelSize;
  let floatBuffer = new Float32Array(terrainTexturePixelSizeValue * terrainTexturePixelSizeValue);
  for (
    let index = 0;
    index < terrainTexturePixelSizeValue * terrainTexturePixelSizeValue;
    index++
  ) {
    floatBuffer[index] =
      0.3 * value[index * 4] + 0.59 * value[index * 4 + 1] + 0.11 * value[index * 4 + 2];
  }
  let floatBuffer2 = new Float32Array(terrainTexturePixelSizeValue * terrainTexturePixelSizeValue);
  let result = 1e9;
  let result2 = -1e9;
  for (let index2 = 0; index2 < terrainTexturePixelSizeValue; index2++) {
    for (let index3 = 0; index3 < terrainTexturePixelSizeValue; index3++) {
      let index4 = 0;
      for (let result4 = -2; result4 <= 2; result4 += 2) {
        for (let result5 = -2; result5 <= 2; result5 += 2) {
          index4 +=
            floatBuffer[
              ((index2 + result4 + terrainTexturePixelSizeValue) % terrainTexturePixelSizeValue) *
                terrainTexturePixelSizeValue +
                ((index3 + result5 + terrainTexturePixelSizeValue) % terrainTexturePixelSizeValue)
            ];
        }
      }
      let result3 = index4 / 9;
      floatBuffer2[index2 * terrainTexturePixelSizeValue + index3] = result3;
      if (result3 < result) {
        result = result3;
      }
      if (result3 > result2) {
        result2 = result3;
      }
    }
  }
  for (
    let index5 = 0;
    index5 < terrainTexturePixelSizeValue * terrainTexturePixelSizeValue;
    index5++
  ) {
    value[index5 * 4 + 3] = Math.round(
      255 *
        clampTextureUnit(
          0.5 +
            ((floatBuffer2[index5] - (result + result2) / 2) / (result2 - result + 1e-5)) * value2,
        ),
    );
  }
}
