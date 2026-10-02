/** Creature proximity, petting dispatch, response messages and heart overlays. */
import * as THREE from "three";
import { hudState } from "../state.js";
export function prepareHudPetting() {
  hudState.hudProjectionScratch = new THREE.Vector3();
}
