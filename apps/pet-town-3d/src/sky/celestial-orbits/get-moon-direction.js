/** Sun and moon directions and elevation from normalized day time. */
import * as THREE from "three";
import { skyState } from "../state.js";
export function getMoonDirection(value, setValue) {
  let result = value + 0.5;
  let result2 = Math.sin(2 * Math.PI * (result - 0.25));
  let result3 = (THREE.MathUtils.degToRad(40) * (result2 + 0.14)) / 1.14;
  let result4 = 2 * Math.PI * (result - 0.25) + 2.35;
  let result5 =
    Math.cos(result4) * skyState.celestialOrbitBasisX.x +
    Math.sin(result4) * skyState.celestialOrbitBasisZ.x;
  let result6 =
    Math.cos(result4) * skyState.celestialOrbitBasisX.z +
    Math.sin(result4) * skyState.celestialOrbitBasisZ.z;
  let result7 = Math.cos(result3);
  return setValue.set(result5 * result7, Math.sin(result3), result6 * result7).normalize();
}
