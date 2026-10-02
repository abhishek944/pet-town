/** Cached primitive meshes, rig groups, glider leaf and blob-shadow texture generation. */
import * as THREE from "three";
export function addPlayerRigGroup(addValue, value = 0, value2 = 0, value3 = 0, value4) {
  let group = new THREE.Group();
  group.position.set(value, value2, value3);
  if (value4) {
    group.name = value4;
  }
  addValue.add(group);
  return group;
}
