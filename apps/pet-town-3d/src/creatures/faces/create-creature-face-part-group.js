/** Surface-conforming eyes, highlights, mouths, blush and expression rigs. */
import * as THREE from "three";
export function createCreatureFacePartGroup(value, value2, value3) {
  let group = new THREE.Group();
  group.name = value;
  group.add(new THREE.Mesh(value2, value3));
  return group;
}
