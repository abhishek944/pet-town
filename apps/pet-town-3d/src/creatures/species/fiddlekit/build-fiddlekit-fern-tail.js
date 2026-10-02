/** Fiddlekit fox geometry, fern tail, acorn beret, ears and face. */
import * as THREE from "three";
import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { configureCreatureJiggleBone } from "../../rig-builders/configure-creature-jiggle-bone.js";
import { createCreatureRigVector } from "../../rig-builders/create-creature-rig-vector.js";
import { createCreatureTaperedTubeGeometry } from "../../geometry/create-creature-tapered-tube-geometry.js";
import { createCreaturePetalGeometry } from "../../geometry/create-creature-petal-geometry.js";
import { orientCreatureGeometry } from "../../rig-builders/orient-creature-geometry.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
export function buildFiddlekitFernTail(body, palette, materials) {
  let configureCreatureJiggleBoneResult = configureCreatureJiggleBone(
    createCreatureBone(`tail`, body, [0, 0.36, -0.2], [-0.55, 0, 0]),
    {
      dir: [0, 0.8, -0.5],
      len: 0.3,
      k: 60,
      d: 4.5,
    },
  );
  {
    let values2 = [
      createCreatureRigVector(0, 0, 0),
      createCreatureRigVector(0, 0.07, -0.06),
      createCreatureRigVector(0, 0.15, -0.1),
      createCreatureRigVector(0, 0.22, -0.1),
    ];
    let creatureRigVectorResult = createCreatureRigVector(0, 0.275, -0.1 + 0.055);
    let result = -Math.PI * 0.75;
    for (let result2 = 1; result2 <= 16; result2++) {
      let result3 = result2 / 16;
      let result4 = result - result3 * Math.PI * 2.1;
      let result5 = 0.078 * (1 - 0.72 * result3);
      values2.push(
        createCreatureRigVector(
          0,
          creatureRigVectorResult.y + result5 * Math.sin(result4),
          creatureRigVectorResult.z + result5 * Math.cos(result4),
        ),
      );
    }
    let catmullRomCurve3 = new THREE.CatmullRomCurve3(values2);
    let values3 = [
      colorCreatureGeometryVertices(
        createCreatureTaperedTubeGeometry(values2, (value7) => 0.042 * (1 - 0.55 * value7), {
          tSeg: 48,
          rSeg: 10,
        }),
        (lerpValue2, value8, position, value9) => {
          lerpCreatureRigColor(
            lerpValue2,
            palette.fern,
            palette.fernTip,
            smoothstepCreatureValue(0.35, 1, value9),
          );
          lerpValue2.lerp(
            getCreatureColor(palette.fernDark),
            smoothstepCreatureValue(-0.2, -0.9, position.x * 0 + position.y) * 0.25,
          );
        },
      ),
    ];
    for (let index = 0; index < 7; index++) {
      let result6 = 0.08 + index * 0.075;
      let pointAtResult = catmullRomCurve3.getPointAt(result6);
      let tangentAtResult = catmullRomCurve3.getTangentAt(result6);
      let result7 = 1 - index * 0.1;
      for (let result8 of [-1, 1]) {
        let creaturePetalGeometryResult = createCreaturePetalGeometry(
          0.022 * result7,
          0.075 * result7,
          0.012,
          {
            tip: 0.8,
            base: 0.4,
            cup: 0.3,
            ws: 8,
            hs: 7,
          },
        );
        colorCreatureGeometryVertices(
          creaturePetalGeometryResult,
          (value10, value11, value12, value13) =>
            lerpCreatureRigColor(value10, palette.fern, palette.fernTip, value13 * 0.7),
        );
        let addScaledVectorResult = createCreatureRigVector(result8, 0, 0)
          .multiplyScalar(0.85)
          .addScaledVector(tangentAtResult, 0.5);
        orientCreatureGeometry(
          creaturePetalGeometryResult,
          [addScaledVectorResult.x, addScaledVectorResult.y, addScaledVectorResult.z],
          [pointAtResult.x, pointAtResult.y, pointAtResult.z],
        );
        values3.push(creaturePetalGeometryResult);
      }
    }
    addCreatureBoneMesh(
      configureCreatureJiggleBoneResult,
      mergeCreatureGeometries(values3),
      materials.body,
    );
  }
}
