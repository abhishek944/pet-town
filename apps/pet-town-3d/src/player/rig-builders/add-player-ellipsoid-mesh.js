/** Cached primitive meshes, rig groups, glider leaf and blob-shadow texture generation. */
import * as THREE from "three";
import { getPlayerLowDetailSphereGeometry } from "./get-player-low-detail-sphere-geometry.js";
import { getPlayerSphereGeometry } from "./get-player-sphere-geometry.js";
export function addPlayerEllipsoidMesh(
  addValue,
  value,
  value2,
  value3,
  value4,
  value5,
  value6 = 0,
  value7 = 0,
  value8 = 0,
  value9 = false,
) {
  let mesh = new THREE.Mesh(
    value9 ? getPlayerLowDetailSphereGeometry() : getPlayerSphereGeometry(),
    value,
  );
  mesh.scale.set(value2 * value3, value2 * value4, value2 * value5);
  mesh.position.set(value6, value7, value8);
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  addValue.add(mesh);
  return mesh;
}
