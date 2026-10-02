/** Water surface uniforms, refraction color conversion, coast sampling, caustics and glint helper functions. */
import sourceAsset51 from "./assets/prepare-water-shaders-fragment-declarations-section-1-51.glsl?raw";
import sourceAsset52 from "./assets/prepare-water-shaders-fragment-declarations-section-2-52.glsl?raw";
import sourceAsset53 from "./assets/prepare-water-shaders-fragment-declarations-section-3-53.glsl?raw";
import sourceAsset54 from "./assets/prepare-water-shaders-fragment-declarations-section-4-54.glsl?raw";
import { waterState } from "../../state.js";
export function prepareWaterShadersFragmentDeclarations() {
  waterState.waterSurfaceFragmentDeclarations =
    sourceAsset51 +
    String(waterState.waterSurfaceCommonShader) +
    sourceAsset52 +
    String(waterState.waterRippleLifetime.toFixed(3)) +
    sourceAsset53 +
    String(waterState.waterRippleSpeed.toFixed(3)) +
    sourceAsset54;
}
