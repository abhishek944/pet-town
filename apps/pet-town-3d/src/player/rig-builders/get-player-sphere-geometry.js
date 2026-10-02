/** Cached primitive meshes, rig groups, glider leaf and blob-shadow texture generation. */
import * as THREE from "three";
import { playerState } from "../state.js";
export function getPlayerSphereGeometry() {
  return (playerState.playerGeometryCache.s ??= new THREE.SphereGeometry(1, 32, 22));
}
