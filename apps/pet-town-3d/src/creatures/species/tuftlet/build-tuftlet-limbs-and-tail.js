import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { configureCreatureLegBone } from "../../rig-builders/configure-creature-leg-bone.js";
import { fillCreatureGeometryColor } from "../../geometry/fill-creature-geometry-color.js";
import { createCreatureLimbGeometry } from "../../geometry/create-creature-limb-geometry.js";
import { createCreatureTaperedTubeGeometry } from "../../geometry/create-creature-tapered-tube-geometry.js";
import { createCreatureRigVector } from "../../rig-builders/create-creature-rig-vector.js";
import { createCreaturePetalGeometry } from "../../geometry/create-creature-petal-geometry.js";
import { configureCreatureJiggleBone } from "../../rig-builders/configure-creature-jiggle-bone.js";
export function buildTuftletLimbsAndTail(bob, palette, materials, body) {
  for (let result3 of [-1, 1]) {
    addCreatureBoneMesh(
      configureCreatureLegBone(
        createCreatureBone(`leg`, bob, [result3 * 0.065, 0.13, 0.02]),
        result3 < 0 ? 0 : 0.5,
        {
          amp: 0.5,
        },
      ),
      mergeCreatureGeometries([
        fillCreatureGeometryColor(
          createCreatureLimbGeometry(0.018, 0.1, {
            r2: 0.013,
          }),
          palette.leg,
        ),
        ...[-0.5, 0, 0.5].map((value4) =>
          fillCreatureGeometryColor(
            createCreatureTaperedTubeGeometry(
              [
                createCreatureRigVector(0, -0.115, 0),
                createCreatureRigVector(Math.sin(value4) * 0.05, -0.12, Math.cos(value4) * 0.05),
              ],
              0.012,
              {
                tSeg: 4,
                rSeg: 6,
              },
            ),
            palette.leg,
          ),
        ),
      ]),
      materials.body,
    );
  }
  for (let result4 of [-1, 1]) {
    let creatureBoneResult5 = createCreatureBone(result4 < 0 ? `wingL` : `wingR`, body, [
      result4 * 0.17,
      0.33,
      0,
    ]);
    creatureBoneResult5.userData.wing = {
      side: result4,
      folded: true,
    };
    let creaturePetalGeometryResult3 = createCreaturePetalGeometry(0.08, 0.21, 0.025, {
      tip: 0.6,
      base: 0.45,
      bend: -0.05,
    });
    colorCreatureGeometryVertices(
      creaturePetalGeometryResult3,
      (lerpValue2, value5, value6, value7) => {
        lerpCreatureRigColor(
          lerpValue2,
          palette.back,
          palette.backDark,
          smoothstepCreatureValue(0.45, 0.85, value7),
        );
        lerpValue2.lerp(
          getCreatureColor(palette.bar),
          smoothstepCreatureValue(0.36, 0.42, value7) -
            smoothstepCreatureValue(0.5, 0.56, value7) +
            (smoothstepCreatureValue(0.62, 0.67, value7) -
              smoothstepCreatureValue(0.74, 0.79, value7)),
        );
        lerpValue2.lerp(
          getCreatureColor(palette.wingTip),
          smoothstepCreatureValue(0.86, 0.97, value7),
        );
      },
    );
    transformCreatureGeometry(creaturePetalGeometryResult3, [0, 0, 0], [-2.35, 0, -result4 * 0.12]);
    addCreatureBoneMesh(creatureBoneResult5, creaturePetalGeometryResult3, materials.body);
  }
  addCreatureBoneMesh(
    configureCreatureJiggleBone(createCreatureBone(`tail`, body, [0, 0.24, -0.17], [-1.2, 0, 0]), {
      dir: [0, 1, 0],
      len: 0.14,
      k: 110,
      d: 6,
    }),
    mergeCreatureGeometries(
      [-0.45, 0, 0.45].map((value8) => {
        let creaturePetalGeometryResult4 = createCreaturePetalGeometry(0.044, 0.16, 0.014, {
          tip: 0.5,
          base: 0.4,
        });
        colorCreatureGeometryVertices(
          creaturePetalGeometryResult4,
          (value9, value10, value11, value12) => {
            lerpCreatureRigColor(
              value9,
              palette.back,
              palette.bar,
              smoothstepCreatureValue(0.5, 0.95, value12),
            );
          },
        );
        transformCreatureGeometry(creaturePetalGeometryResult4, [0, 0, 0], [0, 0, value8]);
        return creaturePetalGeometryResult4;
      }),
    ),
    materials.body,
  );
}
