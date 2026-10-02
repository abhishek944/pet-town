/** Shared fog/cloud-shadow uniforms and Three.js shader chunk integration. */
import { skyState } from "../state.js";
export function prepareSkyShaderPatches() {
  skyState.skyGlobalShaderUniforms = {
    fogSunDir: new Float32Array([0, 1, 0]),
    fogSunColor: new Float32Array([0, 0, 0]),
    skyCloudShadowInv: new Float32Array(16),
    skyCloudShadowP: new Float32Array([0, 0.55, 0.012, 0]),
    skyCloudShadowL: new Float32Array([0, 1, 0, 180]),
    skyCloudShadowW: new Float32Array([0, 0, 0, 0]),
  };
  skyState.skyShaderPatchesInstalled = false;
}
