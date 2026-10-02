/** Cached primitive meshes, rig groups, glider leaf and blob-shadow texture generation. */
import * as THREE from "three";
import { playerState } from "../state.js";
export function getPlayerLowDetailSphereGeometry() {
  return (playerState.playerGeometryCache.sl ??= new THREE.SphereGeometry(1, 14, 10));
}
