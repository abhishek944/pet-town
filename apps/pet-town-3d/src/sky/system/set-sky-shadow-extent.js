/** Sky lifecycle, state and controls, light sampling, exposure and stabilized shadow camera updates. */
import { skyState } from "../state.js";
export function setSkyShadowExtent(value) {
  skyState.skyShadowHalfExtent = value;
  skyState.skyShadowLightDistance = Math.max(160, value * 1.8);
  Object.assign(skyState.skyDirectionalLight.shadow.camera, {
    left: -value,
    right: value,
    top: value,
    bottom: -value,
    near: 1,
    far: skyState.skyShadowLightDistance * 2.6,
  });
  skyState.skyDirectionalLight.shadow.camera.updateProjectionMatrix();
}
