/** Vegetation rebuilds, terrain subscriptions, dirty-cell resampling and item removal. */
import { hideVegetationProxyRange } from "../proxies/hide-vegetation-proxy-range.js";
import { vegetationState } from "../state.js";
export function hideVegetationItem(fieldValue) {
  fieldValue.field.hide(fieldValue);
  hideVegetationProxyRange(fieldValue);
  if (fieldValue.field.o.kind === `log`) {
    vegetationState.vegetationRuntimeState.colliders =
      vegetationState.vegetationRuntimeState.colliders.filter(
        (itemValue) => itemValue.item !== fieldValue,
      );
  }
}
