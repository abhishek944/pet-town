/** UV generation, transform composition, vertex color baking and material-batched geometry builder. */
import * as THREE from "three";
export function clonePropColor(cloneValue) {
  return cloneValue instanceof THREE.Color ? cloneValue.clone() : new THREE.Color(cloneValue);
}
