/** Guarded initialization and per-frame vegetation updates including props, water bobbing, quality and wind. */
import { vegetationState } from "../state.js";
import { updateVegetationVisibility } from "../visibility/update-vegetation-visibility.js";
import { clampVegetationValue } from "../random/clamp-vegetation-value.js";
export function updateVegetationQuality(frame) {
  if (
    vegetationState.vegetationRuntimeState.built &&
    (updateVegetationVisibility(frame.context),
    vegetationState.vegetationRuntimeState.fadeTier !==
      vegetationState.vegetationRuntimeState.tierName)
  ) {
    vegetationState.vegetationRuntimeState.fadeTier =
      vegetationState.vegetationRuntimeState.tierName;
    let result4 =
      vegetationState.vegetationQualityTiers[vegetationState.vegetationRuntimeState.tierName] ||
      vegetationState.vegetationQualityTiers.high;
    let dist2 = result4.dist;
    for (let result6 of Object.values(vegetationState.vegetationRuntimeState.materials)) {
      if (result6.baseFade) {
        result6.uniforms.uFade.value.copy(result6.baseFade).multiplyScalar(dist2);
      }
    }
    let clampVegetationValueResult = clampVegetationValue(
      Number(frame.context.params?.get?.(`vegGrass`)) || 1,
      0.2,
      1,
    );
    let [look2, look3, look4] = result4.look;
    let result5 = 1 - clampVegetationValueResult;
    for (let result7 of [`grass`, `tall`]) {
      let uniforms2 = vegetationState.vegetationRuntimeState.materials[result7].uniforms;
      uniforms2.uTierScale.value.set(
        look2 * (1 + 0.35 * result5),
        look3 * (1 + 0.1 * result5),
        look2 * (1 + 0.35 * result5),
      );
      uniforms2.uTierTint.value = look4 * (1 - 0.12 * result5);
    }
  }
}
