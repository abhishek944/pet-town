import { updateWaterTerrain } from "./update-water-terrain.js";
import { updateWaterLighting } from "./update-water-lighting.js";
import { updateWaterSplashEffects } from "./update-water-splash-effects.js";
import { updateWaterInteractors } from "./update-water-interactors.js";
import { updateWaterDebug } from "./update-water-debug.js";
/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */

import { waterState } from "../state.js";
export function updateWaterSystem(deltaTime, context) {
  const frame = {
    deltaTime,
    context,
  };
  if (!waterState.waterRuntimeState) {
    return;
  }
  updateWaterTerrain(frame);
  updateWaterLighting(frame);
  updateWaterSplashEffects(frame);
  updateWaterInteractors(frame);
  updateWaterDebug(frame);
}
