/** Shared GLSL tone mapping, procedural noise, gradients and horizon haze. */
import sourceAsset32 from "./assets/prepare-sky-shaders-common-section-1-32.glsl?raw";
import sourceAsset33 from "./assets/prepare-sky-shaders-common-section-2-33.glsl?raw";
import sourceAsset34 from "./assets/prepare-sky-shaders-common-section-3-34.glsl?raw";
import sourceAsset35 from "./assets/prepare-sky-shaders-common-section-4-35.glsl?raw";
import sourceAsset36 from "./assets/prepare-sky-shaders-common-section-5-36.glsl?raw";
import sourceAsset37 from "./assets/prepare-sky-shaders-common-37.glsl?raw";
import sourceAsset38 from "./assets/prepare-sky-shaders-common-38.glsl?raw";
import { skyState } from "../../state.js";
import { matrix3ToGlsl } from "../../tone-mapping/matrix3-to-glsl.js";
export function prepareSkyShadersCommon() {
  skyState.skyToneMappingShader =
    sourceAsset32 +
    String(matrix3ToGlsl(skyState.skyInverseAcesOutputMatrix)) +
    sourceAsset33 +
    String(skyState.skyInverseToneMapCeiling.toFixed(4)) +
    sourceAsset34 +
    String(matrix3ToGlsl(skyState.skyInverseAcesInputMatrix)) +
    sourceAsset35 +
    String(skyState.skyInverseToneMapCeiling.toFixed(4)) +
    sourceAsset36;
  skyState.skyNoiseShader = sourceAsset37;
  skyState.skyGradientShader = sourceAsset38;
}
