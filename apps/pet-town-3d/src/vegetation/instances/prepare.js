/** Vegetation state, fixed and level-of-detail instance fields, and water-pass suppression. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { initializeVegetationSystem } from "../lifecycle/initialize-vegetation-system.js";
import { updateVegetationSystem } from "../lifecycle/update-vegetation-system.js";
export function prepareVegetationInstances() {
  vegetationState.vegetationSystem = {
    get init() {
      return initializeVegetationSystem;
    },
    get update() {
      return updateVegetationSystem;
    },
  };
  vegetationState.vegetationRuntimeState = null;
  vegetationState.vegetationInstanceMatrix = new THREE.Matrix4();
  vegetationState.vegetationInstanceQuaternion = new THREE.Quaternion();
  vegetationState.vegetationInstanceEuler = new THREE.Euler();
  vegetationState.vegetationInstancePosition = new THREE.Vector3();
  vegetationState.vegetationInstanceScale = new THREE.Vector3();
  vegetationState.vegetationInstanceColor = new THREE.Color();
  vegetationState.hiddenVegetationMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
}
