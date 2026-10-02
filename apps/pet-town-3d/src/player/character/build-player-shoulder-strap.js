/** Procedurally constructed Pip model, facial expressions and blended locomotion animation. */
import * as THREE from "three";
import { addPlayerRigGroup } from "../rig-builders/add-player-rig-group.js";
import { addPlayerRigMesh } from "../rig-builders/add-player-rig-mesh.js";
import { alignPlayerObjectToNormal } from "../geometry/align-player-object-to-normal.js";
import { lerpPlayerAnimationValue } from "../animation-math/lerp-player-animation-value.js";
import { createPlayerRigVector } from "../animation-math/create-player-rig-vector.js";
import { createPlayerStrapGeometry } from "../geometry/create-player-strap-geometry.js";
import { createPlayerRoundedBoxGeometry } from "../geometry/create-player-rounded-box-geometry.js";
export function buildPlayerShoulderStrap(chestSurface, strapSurface, breath, materials) {
  let values = [];
  let callback = (value6, value7, value8, value9) => {
    let result25 = chestSurface.at(value6, value7, 0);
    if ((value8 || (result25.z = -result25.z), value8)) {
      let result26 = strapSurface.at(value6, value7, 0);
      if (Math.abs(value6) < 0.16 && result26.z > result25.z) {
        result25.copy(result26);
      }
    }
    return result25.add(chestSurface.normal(result25, new THREE.Vector3()).multiplyScalar(value9));
  };
  let values2 = [];
  let callback2 = (cloneValue) => {
    values.push(cloneValue);
    values2.push(cloneValue.clone().sub(chestSurface.c).normalize());
  };
  for (let index2 = 0; index2 <= 10; index2++) {
    let result27 = index2 / 10;
    callback2(
      callback(
        lerpPlayerAnimationValue(-0.2, 0.15, result27),
        lerpPlayerAnimationValue(0.02, 0.33, result27),
        true,
        0.012,
      ),
    );
  }
  callback2(createPlayerRigVector(0.2, 0.37, 0));
  for (let result28 = 10; result28 >= 0; result28--) {
    let result29 = result28 / 10;
    callback2(
      callback(
        lerpPlayerAnimationValue(-0.18, 0.15, result29),
        lerpPlayerAnimationValue(0.02, 0.33, result29),
        false,
        0.012,
      ),
    );
  }
  addPlayerRigMesh(
    breath,
    createPlayerStrapGeometry(values, values2, 0.05, 0.016),
    materials.strap,
  );
  {
    let callbackResult = callback(
      lerpPlayerAnimationValue(-0.2, 0.15, 0.55),
      lerpPlayerAnimationValue(0.02, 0.33, 0.55),
      true,
      0.024,
    );
    let normalResult3 = chestSurface.normal(callbackResult, new THREE.Vector3());
    let addPlayerRigGroupResult3 = addPlayerRigGroup(breath);
    addPlayerRigGroupResult3.position.copy(callbackResult);
    alignPlayerObjectToNormal(addPlayerRigGroupResult3, normalResult3);
    addPlayerRigGroupResult3.rotateZ(-0.83);
    addPlayerRigMesh(
      addPlayerRigGroupResult3,
      createPlayerRoundedBoxGeometry(0.066, 0.05, 0.014, 0.3),
      materials.button,
      false,
    );
    let addPlayerRigMeshResult4 = addPlayerRigMesh(
      addPlayerRigGroupResult3,
      createPlayerRoundedBoxGeometry(0.04, 0.026, 0.016, 0.3),
      materials.strap,
      false,
    );
    addPlayerRigMeshResult4.position.z = 0.002;
  }
}
