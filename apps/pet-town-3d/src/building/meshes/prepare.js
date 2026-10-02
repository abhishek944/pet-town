/** Selection and preview meshes, skinned block instances, debris and block animations. */
import * as THREE from "three";
import { buildingState } from "../state.js";
export function prepareBuildingMeshes() {
  buildingState.placedLanternLights = [];
  buildingState.blockDebrisParticles = [];
  buildingState.blockSkinMeshes = new Map();
  buildingState.buildingTransformScratch = new THREE.Matrix4();
  buildingState.buildingQuaternionScratch = new THREE.Quaternion();
  buildingState.buildingEulerScratch = new THREE.Euler();
  buildingState.buildingScaleScratch = new THREE.Vector3();
  new THREE.Vector3();
}
