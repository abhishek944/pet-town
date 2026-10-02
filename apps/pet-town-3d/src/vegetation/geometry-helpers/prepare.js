/** Foliage color ramps and vertex attributes, geometry buffers, normals and geometry merging. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
export function prepareVegetationGeometryHelpers() {
  vegetationState.foliageFullTurn = Math.PI * 2;
  vegetationState.foliageColorScratch = new THREE.Color();
  vegetationState.foliageUpAxis = new THREE.Vector3(0, 1, 0);
  vegetationState.foliageVertexPositionScratch = new THREE.Vector3();
  vegetationState.foliageVertexNormalScratch = new THREE.Vector3();
}
