/** Skinned mesh batching, per-vertex material properties and shadow proxy extraction. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
export function prepareCreaturesBaking() {
  creaturesState.creatureBakeMatrixScratch = new THREE.Matrix4();
  creaturesState.creatureShadowProxyBoneNames = new Set([`body`, `head`, `wingL`, `wingR`]);
}
