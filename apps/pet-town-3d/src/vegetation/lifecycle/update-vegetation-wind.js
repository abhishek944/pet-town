/** Guarded initialization and per-frame vegetation updates including props, water bobbing, quality and wind. */
import { vegetationState } from "../state.js";
export function updateVegetationWind(frame) {
  vegetationState.vegetationRuntimeState.windTime += frame.delta * (frame.api.sway.speed ?? 1);
  frame.uniforms.uTime.value = vegetationState.vegetationRuntimeState.windTime;
  frame.windDirection = frame.api.sway.direction;
  if (frame.windDirection.lengthSq() > 1e-6) {
    frame.uniforms.uWind.value.x = frame.windDirection.x;
    frame.uniforms.uWind.value.y = frame.windDirection.y;
  }
  if (!vegetationState.vegetationRuntimeState.userGust) {
    frame.uniforms.uGust.value =
      0.85 +
      0.25 * Math.sin(vegetationState.vegetationRuntimeState.windTime * 0.13) +
      0.1 * Math.sin(vegetationState.vegetationRuntimeState.windTime * 0.041 + 1.3);
  }
}
