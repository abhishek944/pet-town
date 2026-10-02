/** Guarded initialization and per-frame vegetation updates including props, water bobbing, quality and wind. */
import { vegetationState } from "../state.js";
import { clampVegetationValue } from "../random/clamp-vegetation-value.js";
import { vegetationSmoothstep } from "../random/vegetation-smoothstep.js";
export function updateVegetationLighting(frame) {
  frame.sun = frame.context.sun;
  if (
    (frame.sun?.position &&
      (vegetationState.vegetationSunDirectionScratch.copy(frame.sun.position),
      frame.sun.target &&
        vegetationState.vegetationSunDirectionScratch.sub(frame.sun.target.position),
      vegetationState.vegetationSunDirectionScratch.lengthSq() > 1e-6 &&
        frame.uniforms.uSunDir.value.copy(
          vegetationState.vegetationSunDirectionScratch.normalize(),
        )),
    frame.context.camera &&
      frame.uniforms.uSunDirView.value
        .copy(frame.uniforms.uSunDir.value)
        .transformDirection(frame.context.camera.matrixWorldInverse),
    frame.sun?.color)
  ) {
    let result12 =
      clampVegetationValue((frame.sun.intensity ?? 1) / 2.4, 0, 1.25) *
      vegetationSmoothstep(-0.08, 0.2, frame.uniforms.uSunDir.value.y) *
      (frame.sun.visible === false ? 0 : 1);
    frame.uniforms.uSunLight.value.copy(frame.sun.color).multiplyScalar(result12);
  }
}
