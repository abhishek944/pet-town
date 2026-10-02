import surfaceFoamHighlightsShader from "./assets/surface-foam-highlights.glsl?raw";
/** Water surface shading: refraction, absorption, reflection, foam, ripples, specular highlights and debug views. */
import surfaceOpticsShader from "./assets/surface-optics.glsl?raw";
import { waterState } from "../../state.js";
export function prepareWaterShadersFragmentOutput() {
  waterState.waterSurfaceFragmentOutput = surfaceOpticsShader + surfaceFoamHighlightsShader;
}
