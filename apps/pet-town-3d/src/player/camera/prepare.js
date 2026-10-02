/** Follow-camera smoothing, orbit controls, obstruction avoidance and opening dolly. */
import * as THREE from "three";
import { playerState } from "../state.js";
export function preparePlayerCamera() {
  playerState.playerCameraOffsetDirection = new THREE.Vector3();
  playerState.playerCameraForwardScratch = new THREE.Vector3();
  playerState.playerCameraRightScratch = new THREE.Vector3();
  playerState.playerCameraUpScratch = new THREE.Vector3();
}
