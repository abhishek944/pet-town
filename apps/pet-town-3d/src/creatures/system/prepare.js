/** Creature lifecycle, context integration, lighting, animation distance limits and shadow batches. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
export function prepareCreaturesSystem() {
  creaturesState.creatureDebugCameraPosition = new THREE.Vector3();
  creaturesState.creatureDebugCameraTarget = new THREE.Vector3();
}
