/** Shared CPU and GLSL swell wave parameters and height sampling. */
import { waterState } from "../state.js";
export function sampleWaterSwellHeight(value, value2, value3) {
  let index = 0;
  for (let result of waterState.waterSwellWaves) {
    index +=
      Math.sin((result.dx * value + result.dz * value2) * result.k - value3 * result.speed) *
      result.amp;
  }
  return index;
}
