/** Color and lighting keyframes and interpolation across the day/night cycle. */
import * as THREE from "three";
export let createSkyDisplayColor = (value) =>
  new THREE.Color().setHex(value, THREE.LinearSRGBColorSpace);
