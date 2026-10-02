/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
export function prepareCreaturesGeometry() {
  creaturesState.creatureGeometryPositionScratch = new THREE.Vector3();
  creaturesState.creatureGeometryNormalScratch = new THREE.Vector3();
  creaturesState.creatureTubeCenterScratch = new THREE.Vector3();
  creaturesState.creatureGeometryTransformScratch = new THREE.Matrix4();
  creaturesState.creatureGeometryQuaternionScratch = new THREE.Quaternion();
  creaturesState.creatureGeometryEulerScratch = new THREE.Euler();
  creaturesState.creatureGeometryScaleScratch = new THREE.Vector3();
  creaturesState.creatureColorCache = new Map();
}
