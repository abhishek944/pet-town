/** Procedurally constructed Pip model, facial expressions and blended locomotion animation. */
import * as THREE from "three";
import { addPlayerRigMesh } from "../rig-builders/add-player-rig-mesh.js";
import { createPlayerTaperedTubeGeometry } from "../geometry/create-player-tapered-tube-geometry.js";
import { lerpPlayerAnimationValue } from "../animation-math/lerp-player-animation-value.js";
export function buildPlayerHair(faceSurface, head, materials) {
  let callback5 = (values6, value24, value25 = 0.6) => {
    let result48 = values6.map(([value26, value27], value28) =>
      faceSurface.at(
        value26,
        value27,
        value24 * value25 * (1 - (value28 / (values6.length - 1)) * 0.5),
      ),
    );
    return addPlayerRigMesh(
      head,
      createPlayerTaperedTubeGeometry(
        result48,
        (value29) => value24 * (1 - value29) ** 0.75 + 0.0025,
        {
          tSeg: 24,
          rSeg: 8,
        },
      ),
      materials.hair,
      false,
    );
  };
  {
    let values7 = [];
    let values8 = [];
    let vector = new THREE.Vector3();
    for (let index6 = 0; index6 <= 6; index6++) {
      for (let index7 = 0; index7 <= 28; index7++) {
        let lerpPlayerAnimationValueResult2 = lerpPlayerAnimationValue(-0.235, 0.235, index7 / 28);
        let result49 =
          -0.04 +
          0.264 * Math.sqrt(Math.max(0, 1 - (lerpPlayerAnimationValueResult2 / 0.3) ** 2)) * 0.97;
        let lerpPlayerAnimationValueResult3 = lerpPlayerAnimationValue(
          Math.min(
            result49 - 0.01,
            0.128 +
              (0.035 * Math.abs(lerpPlayerAnimationValueResult2)) / 0.235 +
              0.016 *
                Math.abs(Math.sin(((lerpPlayerAnimationValueResult2 + 0.02) * Math.PI) / 0.085)) **
                  0.6,
          ),
          result49,
          index6 / 6,
        );
        faceSurface.at(
          lerpPlayerAnimationValueResult2,
          lerpPlayerAnimationValueResult3,
          0.0025 + 0.006 * Math.min(1, index6 / 2),
          vector,
        );
        values7.push(vector.x, vector.y, vector.z);
      }
    }
    for (let index8 = 0; index8 < 6; index8++) {
      for (let index9 = 0; index9 < 28; index9++) {
        let result50 = index8 * 29 + index9;
        let result51 = result50 + 28 + 1;
        values8.push(result50, result50 + 1, result51, result51, result50 + 1, result51 + 1);
      }
    }
    let geometry2 = new THREE.BufferGeometry();
    geometry2.setAttribute(`position`, new THREE.Float32BufferAttribute(values7, 3));
    geometry2.setIndex(values8);
    geometry2.computeVertexNormals();
    addPlayerRigMesh(head, geometry2, materials.hair, false);
  }
  callback5(
    [
      [0.035, 0.225],
      [0.01, 0.185],
      [-0.04, 0.15],
      [-0.095, 0.132],
      [-0.13, 0.14],
    ],
    0.032,
  );
  callback5(
    [
      [0.08, 0.215],
      [0.085, 0.18],
      [0.105, 0.152],
      [0.135, 0.145],
    ],
    0.026,
  );
  callback5(
    [
      [-0.075, 0.215],
      [-0.1, 0.19],
      [-0.14, 0.175],
      [-0.165, 0.168],
    ],
    0.02,
  );
  for (let result52 of [-1, 1]) {
    callback5(
      [
        [result52 * 0.2, 0.15],
        [result52 * 0.222, 0.1],
        [result52 * 0.228, 0.05],
        [result52 * 0.214, 0.015],
      ],
      0.028,
      0.55,
    );
  }
}
