/** Shared creature materials, fur shading, emissive variants and day-night lighting. */
import { creaturesState } from "../state.js";
export function updateCreatureMaterialLighting(value2, value3) {
  if (!creaturesState.creatureMaterials) {
    return;
  }
  let result = 0.35 + 0.95 * value2 + 0.12 * Math.sin(value3 * 2.3) * value2;
  creaturesState.creatureMaterials.glow.color.setScalar(result);
  for (let result2 of creaturesState.creatureMaterials.stylized) {
    let userData2 = result2.userData;
    userData2.rim.value = userData2.rimBase * (1 - 0.6 * value2);
    userData2.lift.value = userData2.liftBase * (1 - 0.5 * value2);
  }
  creaturesState.creatureMaterials.jelly.userData.lift.value =
    creaturesState.creatureMaterials.jelly.userData.liftBase * (1 - 0.35 * value2);
  creaturesState.creatureMaterials.uber.userData.lum.value = 0.12 + 0.28 * value2;
  creaturesState.creatureMaterials.uber.userData.spot.value = result;
  creaturesState.creatureMaterials.uber.userData.hi.value = 1.45 - 0.75 * value2;
  creaturesState.creatureMaterials.inner.opacity = 0.32 + 0.06 * value2;
}
