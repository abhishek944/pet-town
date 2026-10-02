/** Procedurally constructed Pip model, facial expressions and blended locomotion animation. */
import * as THREE from "three";
import { addPlayerRigGroup } from "../rig-builders/add-player-rig-group.js";
import { addPlayerEllipsoidMesh } from "../rig-builders/add-player-ellipsoid-mesh.js";
import { playerEllipsoidSurface } from "../geometry/player-ellipsoid-surface.js";
import { addPlayerRigMesh } from "../rig-builders/add-player-rig-mesh.js";
import { alignPlayerObjectToNormal } from "../geometry/align-player-object-to-normal.js";
export function buildPlayerFaceSurface(head, materials) {
  let faceSurface = (this.faceS = new playerEllipsoidSurface(
    [0, -0.04, 0.195],
    [0.3, 0.264, 0.24],
  ));
  let addPlayerEllipsoidMeshResult3 = addPlayerEllipsoidMesh(
    head,
    materials.skin,
    0.3,
    1,
    0.88,
    0.8,
    0,
    -0.04,
    0.195,
  );
  addPlayerEllipsoidMeshResult3.castShadow = false;
  let addPlayerRigMeshResult2 = addPlayerRigMesh(
    head,
    new THREE.TorusGeometry(0.29, 0.03, 10, 44),
    materials.furLight,
  );
  addPlayerRigMeshResult2.position.set(0, -0.035, 0.258);
  addPlayerRigMeshResult2.scale.set(1, 0.88, 1);
  addPlayerRigMeshResult2.rotation.x = -0.05;
  {
    let result45 = faceSurface.at(0, -0.088, 0.004);
    let normalResult4 = faceSurface.normal(result45, new THREE.Vector3());
    let addPlayerRigGroupResult6 = addPlayerRigGroup(head);
    addPlayerRigGroupResult6.position.copy(result45);
    alignPlayerObjectToNormal(addPlayerRigGroupResult6, normalResult4);
    let addPlayerEllipsoidMeshResult5 = addPlayerEllipsoidMesh(
      addPlayerRigGroupResult6,
      materials.skin,
      0.019,
      1.25,
      0.85,
      0.75,
    );
    addPlayerEllipsoidMeshResult5.castShadow = false;
    for (let result46 of [-1, 1]) {
      let result47 = faceSurface.at(result46 * 0.175, -0.118, -0.004);
      let normalResult5 = faceSurface.normal(result47, new THREE.Vector3());
      let addPlayerRigGroupResult7 = addPlayerRigGroup(head);
      addPlayerRigGroupResult7.position.copy(result47);
      alignPlayerObjectToNormal(addPlayerRigGroupResult7, normalResult5);
      let addPlayerEllipsoidMeshResult6 = addPlayerEllipsoidMesh(
        addPlayerRigGroupResult7,
        materials.skin,
        0.062,
        1.1,
        0.78,
        0.32,
      );
      addPlayerEllipsoidMeshResult6.castShadow = false;
    }
  }
  return {
    faceSurface,
  };
}
