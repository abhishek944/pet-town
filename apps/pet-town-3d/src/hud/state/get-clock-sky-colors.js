/** HUD context, state, DOM helpers, clock colors and weather display values. */
import { hudState } from "../state.js";
import { interpolateHudHexColors } from "./interpolate-hud-hex-colors.js";
export function getClockSkyColors(hours) {
  for (let index = 0; index < hudState.clockSkyColorStops.length - 1; index++) {
    let [result, result2, result3] = hudState.clockSkyColorStops[index];
    let [result4, result5, result6] = hudState.clockSkyColorStops[index + 1];
    if (hours >= result && hours <= result4) {
      let result7 = (hours - result) / (result4 - result);
      return [
        interpolateHudHexColors(result2, result5, result7),
        interpolateHudHexColors(result3, result6, result7),
      ];
    }
  }
  return [hudState.clockSkyColorStops[0][1], hudState.clockSkyColorStops[0][2]];
}
