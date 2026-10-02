/** Procedurally constructed Pip model, facial expressions and blended locomotion animation. */
import * as THREE from "three";
import { playerState } from "../state.js";
import { addPlayerRigGroup } from "../rig-builders/add-player-rig-group.js";
import { addPlayerRigMesh } from "../rig-builders/add-player-rig-mesh.js";
import { createPlayerTaperedTubeGeometry } from "../geometry/create-player-tapered-tube-geometry.js";
import { createPlayerRigVector } from "../animation-math/create-player-rig-vector.js";
import { playerMaterialSmoothstep } from "../materials/player-material-smoothstep.js";
import { colorPlayerGeometryVertices } from "../geometry/color-player-geometry-vertices.js";
export function buildPlayerAcornHat(head, materials) {
  {
    let addPlayerRigGroupResult5 = addPlayerRigGroup(
      (this.sprout = addPlayerRigGroup(head, 0.05, 0.33, 0.02, `acornHat`)),
    );
    addPlayerRigGroupResult5.rotation.set(-0.12, 0, -0.32);
    let sphereGeometry2 = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.56);
    let position3 = sphereGeometry2.attributes.position;
    sphereGeometry2.attributes.normal;
    for (let index5 = 0; index5 < position3.count; index5++) {
      position3.setXYZ(
        index5,
        position3.getX(index5) * 0.118,
        position3.getY(index5) * 0.078 + 0.01,
        position3.getZ(index5) * 0.118,
      );
    }
    sphereGeometry2.computeVertexNormals();
    let color7 = new THREE.Color(playerState.playerPalette.acorn);
    let color8 = new THREE.Color(playerState.playerPalette.acornDark);
    let color9 = new THREE.Color(playerState.playerPalette.acornRim);
    colorPlayerGeometryVertices(sphereGeometry2, (copyValue3, position4) => {
      let atan2Result = Math.atan2(position4.z, position4.x);
      let result42 = Math.hypot(position4.x, position4.z) / 0.118;
      let result43 = (1 - result42) * 9;
      let result44 =
        Math.abs(Math.sin(atan2Result * 7 + Math.floor(result43) * 0.45)) *
        (result43 - Math.floor(result43));
      copyValue3
        .copy(color7)
        .lerp(color8, playerMaterialSmoothstep(0.35, 0.75, result44) * 0.7)
        .lerp(color9, playerMaterialSmoothstep(0.9, 1, result42) * 0.8);
    });
    let addPlayerRigMeshResult5 = addPlayerRigMesh(
      addPlayerRigGroupResult5,
      sphereGeometry2,
      materials.acorn,
    );
    addPlayerRigMeshResult5.castShadow = true;
    let addPlayerRigMeshResult6 = addPlayerRigMesh(
      addPlayerRigGroupResult5,
      new THREE.CircleGeometry(0.114, 24).rotateX(Math.PI / 2),
      materials.acorn,
    );
    addPlayerRigMeshResult6.position.y = 0;
    colorPlayerGeometryVertices(addPlayerRigMeshResult6.geometry, (copyValue4) =>
      copyValue4.copy(color8),
    );
    addPlayerRigMesh(
      addPlayerRigGroupResult5,
      createPlayerTaperedTubeGeometry(
        [
          createPlayerRigVector(0, 0.08, 0),
          createPlayerRigVector(0.006, 0.11, 0),
          createPlayerRigVector(0.024, 0.13, 0.004),
          createPlayerRigVector(0.04, 0.128, 0.004),
        ],
        (value23) => 0.014 - 0.007 * value23,
        {
          tSeg: 12,
          rSeg: 7,
        },
      ),
      materials.stem,
    );
  }
}
