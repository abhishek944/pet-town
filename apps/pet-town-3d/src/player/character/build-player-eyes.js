/** Procedurally constructed Pip model, facial expressions and blended locomotion animation. */
import * as THREE from "three";
import { playerState } from "../state.js";
import { addPlayerRigGroup } from "../rig-builders/add-player-rig-group.js";
import { addPlayerRigMesh } from "../rig-builders/add-player-rig-mesh.js";
import { alignPlayerObjectToNormal } from "../geometry/align-player-object-to-normal.js";
import { createPlayerTaperedTubeGeometry } from "../geometry/create-player-tapered-tube-geometry.js";
import { createPlayerRigVector } from "../animation-math/create-player-rig-vector.js";
import { createPlayerIrisGeometry } from "../geometry/create-player-iris-geometry.js";
import { createPlayerEyeHighlightGeometry } from "../geometry/create-player-eye-highlight-geometry.js";
export function buildPlayerEyes(faceSurface, head, materials) {
  let eyeWidth = 0.052;
  let eyeHeight = 0.079;
  let eyeDepth = 0.027;
  let playerIrisGeometryResult = createPlayerIrisGeometry(
    eyeWidth,
    eyeHeight,
    eyeDepth,
    playerState.playerPalette.iris,
    playerState.playerPalette.irisTop,
  );
  let playerEyeHighlightGeometryResult = createPlayerEyeHighlightGeometry(
    eyeWidth,
    eyeHeight,
    eyeDepth,
  );
  let sphereGeometry = new THREE.SphereGeometry(1, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  let callback6 = (value30, value31) => {
    let values9 = [];
    for (let index10 = 0; index10 <= 10; index10++) {
      let result53 = (index10 / 10) * 2 - 1;
      let result54 = result53 * eyeWidth * 0.95;
      let value30Result = value30(result53);
      let result55 = Math.max(
        0,
        1 - (result54 / (eyeWidth * 1.07)) ** 2 - (value30Result / (eyeHeight * 1.07)) ** 2,
      );
      values9.push(
        createPlayerRigVector(
          result54,
          value30Result,
          eyeDepth * value31 * Math.sqrt(result55) + 0.003,
        ),
      );
    }
    return createPlayerTaperedTubeGeometry(
      values9,
      (value32) => 0.0065 * (0.55 + 0.45 * Math.sin(Math.PI * value32)),
      {
        tSeg: 16,
        rSeg: 6,
      },
    );
  };
  let callback6Result = callback6(
    (value33) => -0.00948 - eyeHeight * 0.22 * (1 - value33 * value33),
    1.12,
  );
  let callback6Result2 = callback6(
    (value34) => -0.0237 + eyeHeight * 0.55 * (1 - Math.abs(value34)) ** 1.2,
    1.05,
  );
  this.eyes = [];
  for (let result56 of [-1, 1]) {
    let result57 = faceSurface.at(result56 * 0.105, -0.045, 0);
    let normalResult6 = faceSurface.normal(result57, new THREE.Vector3());
    let addPlayerRigGroupResult8 = addPlayerRigGroup(head);
    addPlayerRigGroupResult8.position.copy(result57).addScaledVector(normalResult6, -0.0081);
    alignPlayerObjectToNormal(addPlayerRigGroupResult8, normalResult6);
    let addPlayerRigGroupResult9 = addPlayerRigGroup(addPlayerRigGroupResult8, 0, 0, 0, `open`);
    addPlayerRigMesh(addPlayerRigGroupResult9, playerIrisGeometryResult, materials.eye, false);
    let addPlayerRigMeshResult7 = addPlayerRigMesh(
      addPlayerRigGroupResult9,
      playerEyeHighlightGeometryResult,
      materials.white,
      false,
    );
    let addPlayerRigGroupResult10 = addPlayerRigGroup(addPlayerRigGroupResult8);
    addPlayerRigGroupResult10.scale.set(eyeWidth * 1.06, eyeHeight * 1.06, eyeDepth * 1.12);
    let addPlayerRigMeshResult8 = addPlayerRigMesh(
      addPlayerRigGroupResult10,
      sphereGeometry,
      materials.skin,
      false,
    );
    let addPlayerRigMeshResult9 = addPlayerRigMesh(
      addPlayerRigGroupResult8,
      callback6Result,
      materials.ink,
      false,
    );
    addPlayerRigMeshResult9.visible = false;
    let addPlayerRigMeshResult10 = addPlayerRigMesh(
      addPlayerRigGroupResult8,
      callback6Result2,
      materials.ink,
      false,
    );
    addPlayerRigMeshResult10.visible = false;
    this.eyes.push({
      root: addPlayerRigGroupResult8,
      open: addPlayerRigGroupResult9,
      hi: addPlayerRigMeshResult7,
      lid: addPlayerRigMeshResult8,
      shut: addPlayerRigMeshResult9,
      happy: addPlayerRigMeshResult10,
    });
  }
}
