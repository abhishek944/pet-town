/** Procedurally constructed Pip model, facial expressions and blended locomotion animation. */
import * as THREE from "three";
import { playerState } from "../state.js";
import { addPlayerRigGroup } from "../rig-builders/add-player-rig-group.js";
import { addPlayerEllipsoidMesh } from "../rig-builders/add-player-ellipsoid-mesh.js";
import { addPlayerRigMesh } from "../rig-builders/add-player-rig-mesh.js";
import { playerMaterialSmoothstep } from "../materials/player-material-smoothstep.js";
import { colorPlayerGeometryVertices } from "../geometry/color-player-geometry-vertices.js";
import { createPlayerEllipsoidGeometry } from "../geometry/create-player-ellipsoid-geometry.js";
export function buildPlayerScarf(breath, materials) {
  let color2 = new THREE.Color(playerState.playerPalette.scarf);
  let color3 = new THREE.Color(playerState.playerPalette.scarfTip);
  let callback3 = (copyValue, value10) => {
    let result30 = Math.sin(value10);
    copyValue.copy(color2).lerp(color3, playerMaterialSmoothstep(0.35, 0.6, result30));
  };
  let addPlayerRigMeshResult = addPlayerRigMesh(
    breath,
    colorPlayerGeometryVertices(
      new THREE.TorusGeometry(0.19, 0.068, 12, 40),
      (value11, position2) => callback3(value11, Math.atan2(position2.y, position2.x) * 7),
    ),
    materials.scarfV,
  );
  addPlayerRigMeshResult.rotation.x = Math.PI / 2;
  addPlayerRigMeshResult.scale.set(1, 0.96, 1);
  addPlayerRigMeshResult.position.set(0, 0.34, 0);
  let callback4 = (value12, value13, value14) =>
    colorPlayerGeometryVertices(
      createPlayerEllipsoidGeometry(value12 * value14, value12 * value13, value12 * 0.3, 18, 14),
      (value15, yValue) => callback3(value15, (yValue.y / (value12 * value13)) * 5.5 + 1.2),
    );
  this.scarf1 = addPlayerRigGroup(breath, -0.1, 0.33, -0.15, `scarf1`);
  addPlayerRigMesh(this.scarf1, callback4(0.1, 1.55, 0.72), materials.scarfV).position.y = -0.1;
  this.scarf2 = addPlayerRigGroup(this.scarf1, 0, -0.22, 0, `scarf2`);
  addPlayerRigMesh(this.scarf2, callback4(0.09, 1.3, 0.72), materials.scarfV).position.y = -0.08;
  addPlayerEllipsoidMesh(this.scarf2, materials.scarfTip, 0.065, 1, 0.45, 0.42, 0, -0.19, 0, true);
}
