/** Creature system namespace, world state, terrain queries, obstruction checks and nearby effects. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { initializeCreatures } from "../system/initialize-creatures.js";
import { updateCreatures } from "../system/update-creatures.js";
export function prepareCreaturesWorld() {
  creaturesState.creaturesSystem = {
    get init() {
      return initializeCreatures;
    },
    get update() {
      return updateCreatures;
    },
  };
  creaturesState.creatureGravity = 22;
  creaturesState.creatureBehaviorTau = Math.PI * 2;
  creaturesState.creatureWorldPositionScratch = new THREE.Vector3();
  creaturesState.creatureWorldTargetScratch = new THREE.Vector3();
  creaturesState.creatureJiggleRotationScratch = new THREE.Quaternion();
  creaturesState.creatureJiggleIdentityScratch = new THREE.Quaternion();
  creaturesState.creatureWorldMatrixScratch = new THREE.Matrix4();
  creaturesState.creatureRightAxis = new THREE.Vector3(1, 0, 0);
  creaturesState.creatureIdentityQuaternion = new THREE.Quaternion();
  creaturesState.creatureRenderLayer = 7;
  creaturesState.creatureCardinalDirections = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  creaturesState.creaturesRuntime = null;
  creaturesState.creatureTreeSpatialIndex = null;
  creaturesState.creatureTreeSpatialIndexTime = -1;
}
