/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
export function createCreatureWeldedSphereGeometry(value, value2) {
  let sphereGeometry = new THREE.SphereGeometry(1, value, value2);
  sphereGeometry.deleteAttribute(`uv`);
  sphereGeometry.deleteAttribute(`normal`);
  sphereGeometry = mergeVertices(sphereGeometry, 1e-5);
  return sphereGeometry;
}
