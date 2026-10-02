/** Creature bones, jointed legs, jiggle metadata, mesh orientation and extrusion helpers. */
import * as THREE from "three";
export function createCreatureBone(value, userDataValue, value2 = [0, 0, 0], value3 = [0, 0, 0]) {
  let group = new THREE.Group();
  group.name = value;
  group.userData.abs = value2;
  let result = userDataValue?.userData.abs ?? [0, 0, 0];
  group.position.set(value2[0] - result[0], value2[1] - result[1], value2[2] - result[2]);
  group.rotation.set(value3[0], value3[1], value3[2], `YXZ`);
  if (userDataValue) {
    userDataValue.add(group);
  }
  return group;
}
