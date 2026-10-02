/** Procedurally constructed Pip model, facial expressions and blended locomotion animation. */
import * as THREE from "three";
import { addPlayerRigGroup } from "../rig-builders/add-player-rig-group.js";
import { addPlayerEllipsoidMesh } from "../rig-builders/add-player-ellipsoid-mesh.js";
import { addPlayerRigMesh } from "../rig-builders/add-player-rig-mesh.js";
import { mapPlayerGeometrySurface } from "../geometry/map-player-geometry-surface.js";
import { createPlayerLeafPatchGeometry } from "../geometry/create-player-leaf-patch-geometry.js";
import { samplePlayerLeafPatchOutline } from "../geometry/sample-player-leaf-patch-outline.js";
import { alignPlayerObjectToNormal } from "../geometry/align-player-object-to-normal.js";
import { createPlayerTaperedTubeGeometry } from "../geometry/create-player-tapered-tube-geometry.js";
export function buildPlayerBellyPatch(chestSurface, breath, materials) {
  {
    let result18 = 0.23;
    let result19 = 0.15;
    let result20 = -0.35;
    let callback7 = (value, value2, value3) => {
      let result21 = Math.cos(result20);
      let result22 = Math.sin(result20);
      return chestSurface.at(
        0.02 + value * result21 - value2 * result22,
        0.13 + value * result22 + value2 * result21,
        value3,
      );
    };
    addPlayerRigMesh(
      breath,
      mapPlayerGeometrySurface(
        createPlayerLeafPatchGeometry(result18, result19, 24),
        (value4, value5) => callback7(value4, value5, 0.004),
      ),
      materials.belly,
      false,
    );
    for (let [result23, result24] of samplePlayerLeafPatchOutline(result18, result19, 22, 0.014)) {
      let callback7Result = callback7(result23, result24, 0.0065);
      let normalResult2 = chestSurface.normal(callback7Result, new THREE.Vector3());
      let addPlayerRigGroupResult2 = addPlayerRigGroup(breath);
      addPlayerRigGroupResult2.position.copy(callback7Result);
      alignPlayerObjectToNormal(addPlayerRigGroupResult2, normalResult2);
      addPlayerEllipsoidMesh(
        addPlayerRigGroupResult2,
        materials.bellyStitch,
        0.006,
        1.6,
        0.8,
        0.6,
        0,
        0,
        0,
        true,
      ).castShadow = false;
    }
    let values4 = [];
    for (let index = 0; index <= 8; index++) {
      values4.push(callback7(0, (index / 8 - 0.5) * result18 * 0.8, 0.0065));
    }
    addPlayerRigMesh(
      breath,
      createPlayerTaperedTubeGeometry(values4, 0.0035, {
        tSeg: 16,
        rSeg: 5,
      }),
      materials.bellyStitch,
      false,
    );
  }
}
