/** Instanced cloud puff shaders, generation, wind drift and transparent depth sorting. */
import sourceAsset44 from "./assets/prepare-sky-clouds-44.glsl?raw";
import sourceAsset45 from "./assets/prepare-sky-clouds-section-1-45.glsl?raw";
import sourceAsset46 from "./assets/prepare-sky-clouds-section-2-46.glsl?raw";
import sourceAsset47 from "./assets/prepare-sky-clouds-section-3-47.glsl?raw";
import sourceAsset48 from "./assets/prepare-sky-clouds-section-4-48.glsl?raw";
import { skyState } from "../state.js";
export function prepareSkyClouds() {
  skyState.skyCloudsVertexShader = sourceAsset44;
  skyState.skyCloudsFragmentShader =
    sourceAsset45 +
    String(skyState.skyToneMappingShader) +
    sourceAsset46 +
    String(skyState.skyNoiseShader) +
    sourceAsset47 +
    String(skyState.skyGradientShader) +
    sourceAsset48;
}
