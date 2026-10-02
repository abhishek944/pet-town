/** Creature bones, jointed legs, jiggle metadata, mesh orientation and extrusion helpers. */
import * as THREE from "three";
export function createCreatureRigRoot() {
  let group = new THREE.Group();
  group.name = `root`;
  group.userData.abs = [0, 0, 0];
  return group;
}
