/** Surface-conforming eyes, highlights, mouths, blush and expression rigs. */
import * as THREE from "three";
import { projectCreaturePointOntoEllipsoid } from "../geometry/project-creature-point-onto-ellipsoid.js";
import { creatureSphericalDirection } from "../geometry/creature-spherical-direction.js";
import { creatureEllipsoidNormal } from "../geometry/creature-ellipsoid-normal.js";
export function sampleCreatureFaceSurface(value, value2, value3) {
  let { center: valueValue, radii: valueValue2 } = value;
  let projectCreaturePointOntoEllipsoidResult = projectCreaturePointOntoEllipsoid(
    creatureSphericalDirection(value2, value3).multiplyScalar(10),
    valueValue2,
  );
  let creatureEllipsoidNormalResult = creatureEllipsoidNormal(
    projectCreaturePointOntoEllipsoidResult,
    valueValue2,
  );
  projectCreaturePointOntoEllipsoidResult.add(new THREE.Vector3(...valueValue));
  return {
    p: projectCreaturePointOntoEllipsoidResult,
    n: creatureEllipsoidNormalResult,
  };
}
