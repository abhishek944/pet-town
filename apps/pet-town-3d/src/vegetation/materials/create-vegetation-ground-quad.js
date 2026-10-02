/** Vegetation shared uniforms, shader chunks, wind displacement, camera fading and material assembly. */
import * as THREE from "three";
export function createVegetationGroundQuad() {
  let planeGeometry = new THREE.PlaneGeometry(1, 1);
  planeGeometry.rotateX(-Math.PI / 2);
  return planeGeometry;
}
