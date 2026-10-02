/** Merged reflection and shadow proxy meshes with removable vertex ranges. */
import { vegetationState } from "../state.js";
export function hideVegetationProxyRange(position2) {
  if (position2.proxyRanges) {
    for (let [result, result2] of [
      [`shadow`, vegetationState.vegetationRuntimeState.proxyShadow],
      [`refl`, vegetationState.vegetationRuntimeState.proxyRefl],
    ]) {
      let result3 = position2.proxyRanges[result];
      if (!result2 || !result3) {
        continue;
      }
      let [result3Value, result3Value2] = result3;
      let position3 = result2.geometry.attributes.position;
      for (
        let result3ValueValue = result3Value;
        result3ValueValue < result3Value2;
        result3ValueValue++
      ) {
        position3.setXYZ(result3ValueValue, position2.x, position2.y, position2.z);
      }
      position3.addUpdateRange(result3Value * 3, (result3Value2 - result3Value) * 3);
      position3.needsUpdate = true;
    }
    position2.proxyRanges = null;
  }
}
