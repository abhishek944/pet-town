/** Color and lighting keyframes and interpolation across the day/night cycle. */
import { skyState } from "../state.js";
import { smoothSkyInterpolation } from "./smooth-sky-interpolation.js";
export function sampleSkyCycle(value, value2) {
  value = ((value % 1) + 1) % 1;
  let length2 = skyState.skyCycleSamples.length;
  let result = length2 - 1;
  for (let index = 0; index < length2; index++) {
    if (skyState.skyCycleSamples[index].t <= value) {
      result = index;
    }
  }
  let result2 = skyState.skyCycleSamples[result];
  let result3 = skyState.skyCycleSamples[(result + 1) % length2];
  let result4 = result3.t - result2.t;
  if (result4 <= 0) {
    result4 += 1;
  }
  let result5 = value - result2.t;
  if (result5 < 0) {
    result5 += 1;
  }
  let smoothSkyInterpolationResult = smoothSkyInterpolation(
    Math.min(Math.max(result5 / result4, 0), 1),
  );
  for (let result6 of skyState.skyCycleColorChannels) {
    value2[result6].copy(result2[result6]).lerp(result3[result6], smoothSkyInterpolationResult);
  }
  for (let result7 of skyState.skyCycleScalarChannels) {
    value2[result7] =
      result2[result7] + (result3[result7] - result2[result7]) * smoothSkyInterpolationResult;
  }
  return value2;
}
