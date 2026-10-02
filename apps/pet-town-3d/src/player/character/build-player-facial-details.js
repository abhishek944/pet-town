/** Procedurally constructed Pip model, facial expressions and blended locomotion animation. */
import * as THREE from "three";
import { addPlayerRigGroup } from "../rig-builders/add-player-rig-group.js";
import { addPlayerEllipsoidMesh } from "../rig-builders/add-player-ellipsoid-mesh.js";
import { addPlayerRigMesh } from "../rig-builders/add-player-rig-mesh.js";
import { alignPlayerObjectToNormal } from "../geometry/align-player-object-to-normal.js";
import { createPlayerTaperedTubeGeometry } from "../geometry/create-player-tapered-tube-geometry.js";
import { createPlayerRigVector } from "../animation-math/create-player-rig-vector.js";
import { createPlayerSurfaceDecalGeometry } from "../geometry/create-player-surface-decal-geometry.js";
export function buildPlayerFacialDetails(faceSurface, head, materials) {
  this.brows = [];
  for (let result58 of [-1, 1]) {
    let result59 = faceSurface.at(result58 * 0.108, 0.078, 0.004);
    let normalResult7 = faceSurface.normal(result59, new THREE.Vector3());
    let addPlayerRigGroupResult11 = addPlayerRigGroup(head);
    addPlayerRigGroupResult11.position.copy(result59);
    alignPlayerObjectToNormal(addPlayerRigGroupResult11, normalResult7);
    let addPlayerRigGroupResult12 = addPlayerRigGroup(addPlayerRigGroupResult11);
    let values10 = [];
    for (let index11 = 0; index11 <= 8; index11++) {
      let result60 = (index11 / 8) * 2 - 1;
      values10.push(
        createPlayerRigVector(
          result60 * 0.036,
          0.009 * (1 - result60 * result60) - result60 * result58 * 0.004,
          0.002 - 0.0022 * result60 * result60,
        ),
      );
    }
    addPlayerRigMesh(
      addPlayerRigGroupResult12,
      createPlayerTaperedTubeGeometry(
        values10,
        (value35) =>
          0.0035 +
          0.0065 *
            Math.sin(
              Math.PI * (result58 > 0 ? value35 * 0.85 + 0.15 : (1 - value35) * 0.85 + 0.15),
            ) **
              0.7,
        {
          tSeg: 16,
          rSeg: 6,
        },
      ),
      materials.hair,
      false,
    );
    this.brows.push({
      side: result58,
      inner: addPlayerRigGroupResult12,
    });
  }
  for (let result61 of [-1, 1]) {
    let addPlayerRigMeshResult11 = addPlayerRigMesh(
      head,
      createPlayerSurfaceDecalGeometry(faceSurface, result61 * 0.182, -0.115, 0.056, 0.035, 0.016),
      materials.blush,
      false,
    );
    addPlayerRigMeshResult11.renderOrder = 2;
  }
  let mouthPosition = faceSurface.at(0, -0.135, 0.0015);
  let normalResult = faceSurface.normal(mouthPosition, new THREE.Vector3());
  let addPlayerRigGroupResult = addPlayerRigGroup(head);
  addPlayerRigGroupResult.position.copy(mouthPosition);
  alignPlayerObjectToNormal(addPlayerRigGroupResult, normalResult);
  this.smile = addPlayerRigMesh(
    addPlayerRigGroupResult,
    new THREE.TorusGeometry(0.024, 0.0072, 6, 14, Math.PI),
    materials.mouth,
    false,
  );
  this.smile.rotation.z = Math.PI;
  this.mouthO = addPlayerRigGroup(addPlayerRigGroupResult, 0, 0.008, 0.0035);
  addPlayerRigMesh(
    this.mouthO,
    new THREE.CircleGeometry(0.034, 20, Math.PI, Math.PI),
    materials.mouth,
    false,
  );
  addPlayerRigMesh(
    this.mouthO,
    new THREE.CircleGeometry(0.018, 14, Math.PI, Math.PI),
    materials.tongue,
    false,
  ).position.set(0, -0.016, 0.001);
  this.ears = [];
  for (let result62 of [-1, 1]) {
    let addPlayerRigGroupResult13 = addPlayerRigGroup(head, result62 * 0.225, 0.235, -0.04);
    addPlayerRigGroupResult13.rotation.set(-0.12, -result62 * 0.25, -result62 * 0.35);
    addPlayerEllipsoidMesh(
      addPlayerRigGroupResult13,
      materials.fur,
      0.125,
      1,
      0.95,
      0.5,
      0,
      0.09,
      0,
    );
    let addPlayerEllipsoidMeshResult7 = addPlayerEllipsoidMesh(
      addPlayerRigGroupResult13,
      materials.earIn,
      0.085,
      1,
      0.92,
      0.4,
      0,
      0.085,
      0.055,
    );
    addPlayerEllipsoidMeshResult7.castShadow = false;
    this.ears.push(addPlayerRigGroupResult13);
  }
}
