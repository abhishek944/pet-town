/** Ray picking, petting reactions and pointer interaction. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
export function raycastCreature(rayValue) {
  if (!rayValue?.ray) {
    return null;
  }
  let result = null;
  let result2 = 1 / 0;
  for (let result3 of creaturesState.creaturesRuntime.list) {
    let result4 = Math.max(result3.def.radius, result3.def.height * 0.5) * result3.size * 1.05;
    creaturesState.creatureWorldPositionScratch
      .set(0, result3.def.height * 0.45 * result3.size + (result3.parts.bob.position.y || 0), 0)
      .add(result3.position);
    let sphere = new THREE.Sphere(creaturesState.creatureWorldPositionScratch, result4);
    let intersectSphereResult = rayValue.ray.intersectSphere(
      sphere,
      creaturesState.creatureWorldTargetScratch,
    );
    if (!intersectSphereResult) {
      continue;
    }
    let distanceToResult = rayValue.ray.origin.distanceTo(intersectSphereResult);
    if (distanceToResult < result2 && distanceToResult <= (rayValue.far ?? 1 / 0)) {
      result2 = distanceToResult;
      result = result3;
    }
  }
  if (result) {
    result.hitDistance = result2;
  }
  return result;
}
