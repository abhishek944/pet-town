/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
export let getCreatureColor = (value) => {
  let result = creaturesState.creatureColorCache.get(value);
  if (!result) {
    result = new THREE.Color(value);
    creaturesState.creatureColorCache.set(value, result);
  }
  return result;
};
