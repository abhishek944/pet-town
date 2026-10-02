import { createWaterInteractions } from "./create-water-interactions.js";
import { createWaterScene } from "./create-water-scene.js";
import { configureWaterReflections } from "./configure-water-reflections.js";
import { configureWaterRendering } from "./configure-water-rendering.js";
import { watchWaterTerrain } from "./watch-water-terrain.js";
import { exposeWaterApi } from "./expose-water-api.js";
import { configureWaterDebug } from "./configure-water-debug.js";
import { exposeWaterRuntime } from "./expose-water-runtime.js";

/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */

export function initializeWaterSystem(context) {
  const state = {
    context,
  };
  createWaterInteractions(state);
  createWaterScene(state);
  configureWaterReflections(state);
  configureWaterRendering(state);
  watchWaterTerrain(state);
  exposeWaterApi(state);
  configureWaterDebug(state);
  exposeWaterRuntime(state);
}
