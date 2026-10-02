/** Color and lighting keyframes and interpolation across the day/night cycle. */
import * as THREE from "three";
import { skyState } from "../state.js";
export function createSkyCycleSample() {
  let options = {};
  for (let result of skyState.skyCycleColorChannels) {
    options[result] = new THREE.Color();
  }
  for (let result2 of skyState.skyCycleScalarChannels) {
    options[result2] = 0;
  }
  return options;
}
