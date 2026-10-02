/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
import * as THREE from "three";
import { playerState } from "../state.js";
export function preparePlayerGeometry() {
  playerState.playerSurfaceNormalScratch = new THREE.Vector3();
  playerState.playerForwardAxis = new THREE.Vector3(0, 0, 1);
}
