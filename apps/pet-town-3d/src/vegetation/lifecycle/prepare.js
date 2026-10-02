/** Guarded initialization and per-frame vegetation updates including props, water bobbing, quality and wind. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
export function prepareVegetationLifecycle() {
  vegetationState.vegetationErrorCount = 0;
  vegetationState.vegetationSunDirectionScratch = new THREE.Vector3();
  vegetationState.vegetationDebugCameraPose = undefined;
}
