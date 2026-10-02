/** Vegetation rebuilds, terrain subscriptions, dirty-cell resampling and item removal. */
import * as THREE from "three";
import { hideVegetationProxyRange } from "../proxies/hide-vegetation-proxy-range.js";
import { vegetationState } from "../state.js";
export function removeVegetationTree(partsValue, value) {
  for (let result of partsValue.parts) {
    result.field.hide(result);
    hideVegetationProxyRange(result);
  }
  if (
    ((vegetationState.vegetationRuntimeState.trees =
      vegetationState.vegetationRuntimeState.trees.filter((value2) => value2 !== partsValue)),
    (vegetationState.vegetationRuntimeState.colliders =
      vegetationState.vegetationRuntimeState.colliders.filter(
        (ownerValue) => ownerValue !== partsValue && ownerValue.owner !== partsValue,
      )),
    (vegetationState.vegetationRuntimeState.canopies = null),
    value)
  ) {
    try {
      vegetationState.vegetationRuntimeState.ctx.fx?.burst?.(
        partsValue.position.clone().add(new THREE.Vector3(0, partsValue.height * 0.6, 0)),
        `leaves`,
      );
    } catch {}
  }
  return partsValue;
}
