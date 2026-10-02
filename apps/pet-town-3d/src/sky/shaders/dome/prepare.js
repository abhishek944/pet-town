/** Sky dome vertex and fragment shaders, including sun, moon, cirrus, milky way and meteors. */
import sourceAsset39 from "./assets/prepare-sky-shaders-dome-section-1-39.glsl?raw";
import sourceAsset40 from "./assets/prepare-sky-shaders-dome-section-2-40.glsl?raw";
import sourceAsset41 from "./assets/prepare-sky-shaders-dome-section-3-41.glsl?raw";
import sourceAsset42 from "./assets/prepare-sky-shaders-dome-section-4-42.glsl?raw";
import { skyState } from "../../state.js";
export function prepareSkyShadersDome() {
  skyState.skyDomeVertexShader = `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
  gl_Position = p.xyww; gl_Position.z *= 0.99999;
}`;
  skyState.skyDomeFragmentShader =
    sourceAsset39 +
    String(skyState.skyToneMappingShader) +
    sourceAsset40 +
    String(skyState.skyNoiseShader) +
    sourceAsset41 +
    String(skyState.skyGradientShader) +
    sourceAsset42;
}
