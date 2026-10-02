/** Canopy surface intersections, rounded clumps and silhouette fringe cards. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
export function prepareVegetationCanopyGeometry() {
  vegetationState.canopySurfaceRaycaster = new THREE.Raycaster();
}
