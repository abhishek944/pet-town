/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import * as THREE from "three";
export let transformPropLocalPoint = (position, value, value2, value3) => {
  let result = Math.cos(position.rot || 0);
  let result2 = Math.sin(position.rot || 0);
  return new THREE.Vector3(
    position.x + value * result + value3 * result2,
    position.y + value2,
    position.z - value * result2 + value3 * result,
  );
};
