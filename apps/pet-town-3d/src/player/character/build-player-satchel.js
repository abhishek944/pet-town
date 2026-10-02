import { addPlayerRigGroup } from "../rig-builders/add-player-rig-group.js";
import { addPlayerEllipsoidMesh } from "../rig-builders/add-player-ellipsoid-mesh.js";
import { addPlayerRigMesh } from "../rig-builders/add-player-rig-mesh.js";
import { createPlayerRoundedBoxGeometry } from "../geometry/create-player-rounded-box-geometry.js";
export function buildPlayerSatchel(breath, materials) {
  let satchel = (this.bag = addPlayerRigGroup(breath, -0.178, -0.045, -0.105, `satchel`));
  satchel.rotation.set(0.12, -2.15, 0.1);
  addPlayerRigMesh(satchel, createPlayerRoundedBoxGeometry(0.15, 0.12, 0.065), materials.bag);
  addPlayerRigMesh(
    satchel,
    createPlayerRoundedBoxGeometry(0.156, 0.07, 0.07, 0.22),
    materials.bagFlap,
  ).position.set(0, 0.03, 0.006);
  let addPlayerEllipsoidMeshResult = addPlayerEllipsoidMesh(
    satchel,
    materials.button,
    0.014,
    1,
    1,
    0.6,
    0,
    0,
    0.043,
    true,
  );
  addPlayerEllipsoidMeshResult.castShadow = false;
  let addPlayerEllipsoidMeshResult2 = addPlayerEllipsoidMesh(
    satchel,
    materials.cream,
    0.02,
    0.6,
    1.2,
    0.3,
    0,
    -0.035,
    0.034,
    true,
  );
  addPlayerEllipsoidMeshResult2.rotation.z = 0.6;
  addPlayerEllipsoidMeshResult2.castShadow = false;
}
