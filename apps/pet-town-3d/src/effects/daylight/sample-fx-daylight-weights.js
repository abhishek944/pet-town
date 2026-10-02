/** Sun elevation and day, golden-hour and night weights for effects. */
import { sampleFxSunElevation } from "./sample-fx-sun-elevation.js";
import { smoothstepFxLightingValue } from "./smoothstep-fx-lighting-value.js";
export function sampleFxDaylightWeights(context) {
  let fxSunElevationResult = sampleFxSunElevation(context);
  let smoothstepFxLightingValueResult = smoothstepFxLightingValue(0.1, 0.45, fxSunElevationResult);
  let result = 1 - smoothstepFxLightingValue(-0.28, 0, fxSunElevationResult);
  return {
    elev: fxSunElevationResult,
    day: smoothstepFxLightingValueResult,
    golden: Math.max(0, 1 - smoothstepFxLightingValueResult - result),
    night: result,
  };
}
