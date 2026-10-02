/** Creature bones, jointed legs, jiggle metadata, mesh orientation and extrusion helpers. */
import * as THREE from "three";
export function addCreatureBoneMesh(
  userDataValue,
  value,
  value2,
  value3 = null,
  value4 = null,
  value5 = ``,
) {
  let mesh = new THREE.Mesh(value, value2);
  if (((mesh.name = value5), (mesh.castShadow = true), value3)) {
    let result = userDataValue.userData.abs ?? [0, 0, 0];
    mesh.position.set(value3[0] - result[0], value3[1] - result[1], value3[2] - result[2]);
  }
  if (value4) {
    mesh.rotation.set(value4[0], value4[1], value4[2], `YXZ`);
  }
  userDataValue.add(mesh);
  return mesh;
}
