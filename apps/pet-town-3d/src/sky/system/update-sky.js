/** Sky lifecycle, state and controls, light sampling, exposure and stabilized shadow camera updates. */
import { skyState } from "../state.js";
import { updateSkyLighting } from "./update-sky-lighting.js";
import { updateSkyShadows } from "./update-sky-shadows.js";
export function updateSky(value, timeOfDayValue) {
  if (!skyState.skyTimeFrozen) {
    timeOfDayValue.timeOfDay =
      ((((timeOfDayValue.timeOfDay ?? 0.4) + value / skyState.skyCycleSeconds) % 1) + 1) % 1;
  }
  updateSkyLighting(value);
  updateSkyShadows(timeOfDayValue);
  skyState.skyClouds.update(value, timeOfDayValue.camera);
}
