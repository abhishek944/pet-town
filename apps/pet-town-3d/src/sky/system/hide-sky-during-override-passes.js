/** Sky lifecycle, state and controls, light sampling, exposure and stabilized shadow camera updates. */
import { skyState } from "../state.js";
export function hideSkyDuringOverridePasses(onBeforeRenderValue) {
  onBeforeRenderValue.onBeforeRender = (value, value2, value3, value4, value5) => {
    if (value5 !== onBeforeRenderValue.material) {
      onBeforeRenderValue.matrixWorld.copy(skyState.skyHiddenWorldMatrix);
    }
  };
  onBeforeRenderValue.onAfterRender = () =>
    onBeforeRenderValue.matrixWorld.copy(skyState.skyIdentityWorldMatrix);
}
