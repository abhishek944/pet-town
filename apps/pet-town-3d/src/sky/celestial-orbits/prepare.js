/** Sun and moon directions and elevation from normalized day time. */
import * as THREE from "three";
import { skyState } from "../state.js";
export function prepareSkyCelestialOrbits() {
  skyState.celestialOrbitBasisX = new THREE.Vector3(1, 0, 0.3).normalize();
  skyState.celestialOrbitBasisZ = new THREE.Vector3(-0.3, 0, 1).normalize();
  skyState.maximumSunElevationRadians = THREE.MathUtils.degToRad(64);
}
