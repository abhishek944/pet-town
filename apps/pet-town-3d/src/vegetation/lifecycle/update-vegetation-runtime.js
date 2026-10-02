/** Guarded initialization and per-frame vegetation updates including props, water bobbing, quality and wind. */
import { vegetationState } from "../state.js";
import { updateVegetationTerrain } from "./update-vegetation-terrain.js";
import { updateVegetationWaterInteraction } from "./update-vegetation-water-interaction.js";
import { updateVegetationQuality } from "./update-vegetation-quality.js";
import { updateVegetationWind } from "./update-vegetation-wind.js";
import { updateVegetationPushers } from "./update-vegetation-pushers.js";
import { updateVegetationLighting } from "./update-vegetation-lighting.js";
import { updateVegetationDebugCamera } from "./update-vegetation-debug-camera.js";
export function updateVegetationRuntime(delta, context) {
  const frame = {
    delta,
    context,
  };
  if (!vegetationState.vegetationRuntimeState) {
    return;
  }
  updateVegetationTerrain(frame);
  updateVegetationWaterInteraction(frame);
  updateVegetationQuality(frame);
  updateVegetationWind(frame);
  updateVegetationPushers(frame);
  updateVegetationLighting(frame);
  updateVegetationDebugCamera(frame);
}
