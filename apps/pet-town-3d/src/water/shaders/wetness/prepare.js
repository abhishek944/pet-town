/** Terrain wetness shader driven by coastal distance and animated sea wash. */
import sourceAsset56 from "./assets/prepare-water-shaders-wetness-56.glsl?raw";
import { waterState } from "../../state.js";
export function prepareWaterShadersWetness() {
  waterState.waterWetnessShader = sourceAsset56;
}
