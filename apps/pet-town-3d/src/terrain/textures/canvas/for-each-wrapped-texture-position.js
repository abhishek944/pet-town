/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
import { terrainState } from "../../state.js";
export function forEachWrappedTexturePosition(value, value2, value3, value4) {
  for (
    let result = -256;
    result <= terrainState.terrainTextureLogicalSize;
    result += terrainState.terrainTextureLogicalSize
  ) {
    for (
      let result2 = -256;
      result2 <= terrainState.terrainTextureLogicalSize;
      result2 += terrainState.terrainTextureLogicalSize
    ) {
      let result3 = value + result;
      let result4 = value2 + result2;
      if (!(
        result3 < -value3 ||
        result3 > terrainState.terrainTextureLogicalSize + value3 ||
        result4 < -value3 ||
        result4 > terrainState.terrainTextureLogicalSize + value3
      )) {
        value4(result3, result4);
      }
    }
  }
}
