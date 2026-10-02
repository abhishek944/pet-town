/** Cached primitive meshes, rig groups, glider leaf and blob-shadow texture generation. */
import * as THREE from "three";
import { addPlayerRigMesh } from "./add-player-rig-mesh.js";
export function addPlayerCapsuleMesh(value, value2, value3, value4, value5) {
  let addPlayerRigMeshResult = addPlayerRigMesh(
    value,
    new THREE.CapsuleGeometry(value3, value4, 6, 14),
    value2,
  );
  addPlayerRigMeshResult.position.y = value5;
  return addPlayerRigMeshResult;
}
