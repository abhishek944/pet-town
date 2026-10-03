/** Public vegetation API for camera fading, wind, clearings, removal, rebuilding and change notification. */

import { vegetationState } from "../state.js";
export function setVegetationCameraFade(position2, position3, value3 = 1.6) {
  let shared3 = vegetationState.vegetationRuntimeState.shared;
  if (!position2 || !position3 || !(value3 > 0)) {
    shared3.uFadeR.value = 0;
    return;
  }
  vegetationState.vegetationRuntimeState.fadeOn = true;
  shared3.uFadeA.value.set(position2.x, position2.y, position2.z);
  shared3.uFadeB.value.set(position3.x, position3.y, position3.z);
  shared3.uFadeR.value = value3;
}
