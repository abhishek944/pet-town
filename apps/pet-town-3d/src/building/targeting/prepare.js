/** Front-facing and cursor targets, ghost placement visualization and lantern light updates. */
import * as THREE from "three";
import { buildingState } from "../state.js";
export function prepareBuildingTargeting() {
  buildingState.buildingRaycaster = new THREE.Raycaster();
  buildingState.buildingRayOriginScratch = new THREE.Vector3();
  buildingState.buildingRayDirectionScratch = new THREE.Vector3();
  buildingState.buildingPlayerPositionScratch = new THREE.Vector3();
  buildingState.buildingAimPositionScratch = new THREE.Vector3();
  buildingState.smoothedPlacementPosition = null;
  buildingState.lanternUpdateAccumulator = 0;
}
