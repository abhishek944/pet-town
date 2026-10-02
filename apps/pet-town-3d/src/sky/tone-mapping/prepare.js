/** CPU inverse tone mapping and display-to-scene color conversion. */
import * as THREE from "three";
import { skyState } from "../state.js";
export function prepareSkyToneMapping() {
  skyState.skyAcesInputMatrix = new THREE.Matrix3().set(
    0.59719,
    0.35458,
    0.04823,
    0.076,
    0.90834,
    0.01566,
    0.0284,
    0.13383,
    0.83777,
  );
  skyState.skyAcesOutputMatrix = new THREE.Matrix3().set(
    1.60475,
    -0.53108,
    -0.07367,
    -0.10208,
    1.10813,
    -0.00605,
    -0.00327,
    -0.07276,
    1.07602,
  );
  skyState.skyInverseAcesInputMatrix = skyState.skyAcesInputMatrix.clone().invert();
  skyState.skyInverseAcesOutputMatrix = skyState.skyAcesOutputMatrix.clone().invert();
  skyState.skyInverseToneMapCeiling = 0.93;
  skyState.skyToneMappingModes = {
    NONE: 0,
    ACES: 1,
    NEUTRAL: 2,
    LINEAR: 3,
    OTHER: 4,
  };
  skyState.skyToneMapScratchVector = new THREE.Vector3();
}
