/** UV generation, transform composition, vertex color baking and material-batched geometry builder. */
import * as THREE from "three";
import { propsState } from "../state.js";
export function preparePropsGeometryBuilder() {
  propsState.propTextureWorldSizes = {
    wood: 2,
    paint: 2,
    brick: 2,
    shingle: 2.2,
    stone: 2.4,
    plaster: 3,
    rock: 2.5,
    soil: 1.6,
    cloth: 1.6,
    sail: 1.5,
    thatch: 2,
  };
  propsState.propTransformQuaternion = new THREE.Quaternion();
  propsState.propTransformEuler = new THREE.Euler();
  propsState.propTransformScale = new THREE.Vector3();
  propsState.propTransformPosition = new THREE.Vector3();
  propsState.propVertexColorScratch = new THREE.Color();
}
