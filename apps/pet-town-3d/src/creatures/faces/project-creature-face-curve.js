/** Surface-conforming eyes, highlights, mouths, blush and expression rigs. */
import * as THREE from "three";
import { createCreatureSurfaceBasis } from "../geometry/create-creature-surface-basis.js";
import { creaturesState } from "../state.js";
import { projectCreaturePointOntoEllipsoid } from "../geometry/project-creature-point-onto-ellipsoid.js";
import { creatureEllipsoidNormal } from "../geometry/creature-ellipsoid-normal.js";
export function projectCreatureFaceCurve(value, nValue, mapValue, value2) {
  let { center: valueValue, radii: valueValue2 } = value;
  let vector = new THREE.Vector3(...valueValue);
  let creatureSurfaceBasisResult = createCreatureSurfaceBasis(nValue.n);
  let setFromMatrixColumnResult = new THREE.Vector3().setFromMatrixColumn(
    creatureSurfaceBasisResult,
    0,
  );
  let setFromMatrixColumnResult2 = new THREE.Vector3().setFromMatrixColumn(
    creatureSurfaceBasisResult,
    1,
  );
  return mapValue.map(([value3, value4]) => {
    creaturesState.creatureFaceProjectionScratch
      .copy(nValue.p)
      .sub(vector)
      .addScaledVector(setFromMatrixColumnResult, value3)
      .addScaledVector(setFromMatrixColumnResult2, value4);
    let projectCreaturePointOntoEllipsoidResult = projectCreaturePointOntoEllipsoid(
      creaturesState.creatureFaceProjectionScratch,
      valueValue2,
      new THREE.Vector3(),
    );
    let creatureEllipsoidNormalResult = creatureEllipsoidNormal(
      projectCreaturePointOntoEllipsoidResult,
      valueValue2,
      new THREE.Vector3(),
    );
    return projectCreaturePointOntoEllipsoidResult
      .add(vector)
      .addScaledVector(creatureEllipsoidNormalResult, value2);
  });
}
