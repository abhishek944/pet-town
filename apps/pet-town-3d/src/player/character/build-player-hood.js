/** Procedurally constructed Pip model, facial expressions and blended locomotion animation. */
import * as THREE from "three";
import { playerState } from "../state.js";
import { addPlayerRigGroup } from "../rig-builders/add-player-rig-group.js";
import { addPlayerEllipsoidMesh } from "../rig-builders/add-player-ellipsoid-mesh.js";
import { playerEllipsoidSurface } from "../geometry/player-ellipsoid-surface.js";
import { addPlayerRigMesh } from "../rig-builders/add-player-rig-mesh.js";
import { mapPlayerGeometrySurface } from "../geometry/map-player-geometry-surface.js";
import { createPlayerLeafPatchGeometry } from "../geometry/create-player-leaf-patch-geometry.js";
import { samplePlayerLeafPatchOutline } from "../geometry/sample-player-leaf-patch-outline.js";
import { createPlayerTaperedTubeGeometry } from "../geometry/create-player-tapered-tube-geometry.js";
import { lerpPlayerAnimationValue } from "../animation-math/lerp-player-animation-value.js";
import { createPlayerRigVector } from "../animation-math/create-player-rig-vector.js";
import { playerMaterialSmoothstep } from "../materials/player-material-smoothstep.js";
import { colorPlayerGeometryVertices } from "../geometry/color-player-geometry-vertices.js";
import { createPlayerEllipsoidGeometry } from "../geometry/create-player-ellipsoid-geometry.js";
export function buildPlayerHood(head, materials) {
  {
    let playerEllipsoidGeometryResult = createPlayerEllipsoidGeometry(
      0.37 * 1.07,
      0.37 * 0.96,
      0.37,
      36,
      26,
    );
    let color4 = new THREE.Color(playerState.playerPalette.furTop);
    let color5 = new THREE.Color(playerState.playerPalette.fur);
    let color6 = new THREE.Color(playerState.playerPalette.furDeep);
    colorPlayerGeometryVertices(playerEllipsoidGeometryResult, (copyValue2, yValue2) => {
      let result31 = yValue2.y / 0.355;
      copyValue2
        .copy(color5)
        .lerp(color4, playerMaterialSmoothstep(0.25, 0.95, result31) * 0.8)
        .lerp(
          color6,
          playerMaterialSmoothstep(0.1, -0.85, result31) * 0.85 +
            playerMaterialSmoothstep(-0.1, -0.37, yValue2.z) * 0.25,
        );
    });
    addPlayerRigMesh(head, playerEllipsoidGeometryResult, materials.hood);
  }
  new playerEllipsoidSurface([0, 0, 0], [0.37 * 1.07, 0.355, 0.37]);
  let values3 = [];
  for (let index3 = 0; index3 <= 18; index3++) {
    let lerpPlayerAnimationValueResult = lerpPlayerAnimationValue(1.05, 2.8, index3 / 18);
    let result32 = 1 + 0.012 / 0.36;
    values3.push(
      createPlayerRigVector(
        0,
        0.355 * Math.sin(lerpPlayerAnimationValueResult) * result32,
        0.37 * Math.cos(lerpPlayerAnimationValueResult) * result32,
      ),
    );
  }
  addPlayerRigMesh(
    head,
    createPlayerTaperedTubeGeometry(
      values3,
      (value16) => 0.026 * Math.min(1, Math.sqrt(value16 * 4), Math.sqrt((1 - value16) * 10)),
      {
        tSeg: 44,
        rSeg: 10,
      },
    ),
    materials.piping,
  );
  {
    let result33 = 0.3;
    let result34 = 0.17;
    let result35 = 0.45;
    let addPlayerRigGroupResult4 = addPlayerRigGroup(head);
    addPlayerRigGroupResult4.position.set(0.02, 0, -0.366);
    addPlayerRigGroupResult4.rotation.y = Math.PI;
    let callback8 = (value17, value18, value19) => {
      let result36 = Math.cos(result35);
      let result37 = Math.sin(result35);
      let result38 = value17 * result36 - value18 * result37;
      let result39 = value17 * result37 + value18 * result36;
      return new THREE.Vector3(
        result38,
        result39,
        value19 - (result38 * result38 + result39 * result39) / 0.74,
      );
    };
    addPlayerRigMesh(
      addPlayerRigGroupResult4,
      mapPlayerGeometrySurface(
        createPlayerLeafPatchGeometry(result33, result34, 24),
        (value20, value21) => callback8(value20, value21, 0.004),
      ),
      materials.cream,
      false,
    );
    for (let [result40, result41] of samplePlayerLeafPatchOutline(result33, result34, 24, 0.016)) {
      let addPlayerEllipsoidMeshResult4 = addPlayerEllipsoidMesh(
        addPlayerRigGroupResult4,
        materials.stitch,
        0.0075,
        1.7,
        0.8,
        0.7,
        0,
        0,
        0,
        true,
      );
      addPlayerEllipsoidMeshResult4.position.copy(callback8(result40, result41, 0.007));
      addPlayerEllipsoidMeshResult4.castShadow = false;
    }
    let values5 = [];
    for (let index4 = 0; index4 <= 8; index4++) {
      values5.push(callback8(0, (index4 / 8 - 0.5) * result33 * 0.82, 0.008));
    }
    addPlayerRigMesh(
      addPlayerRigGroupResult4,
      createPlayerTaperedTubeGeometry(values5, (value22) => 0.007 * (1 - 0.5 * value22), {
        tSeg: 16,
        rSeg: 6,
      }),
      materials.belly,
      false,
    );
  }
}
