/** Cached primitive meshes, rig groups, glider leaf and blob-shadow texture generation. */
import * as THREE from "three";
export function addPlayerRigMesh(addValue, value, value2, value3 = true) {
  let mesh = new THREE.Mesh(value, value2);
  mesh.castShadow = value3;
  addValue.add(mesh);
  return mesh;
}
